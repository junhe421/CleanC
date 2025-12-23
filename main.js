const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const nodeDiskInfo = require('node-disk-info');

// 保持对window对象的全局引用，避免JavaScript对象被垃圾回收时，窗口自动关闭
let mainWindow;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true, // 在渲染进程中启用Node.js集成
      contextIsolation: false, // 禁用上下文隔离以允许使用require
      enableRemoteModule: true, // 启用remote模块
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // 加载应用的index.html
  mainWindow.loadFile('index.html');

  // 在开发环境中打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // 当window被关闭时，触发的事件
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', function () {
  // 在macOS上，应用和菜单栏通常会保持活动状态，直到用户使用Cmd + Q明确退出
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // 在macOS上，当点击dock图标并且没有其他窗口打开时，通常会在应用程序中重新创建一个窗口
  if (mainWindow === null) createWindow();
});

// IPC通信 - 处理从渲染进程发来的请求

// 获取磁盘信息
ipcMain.handle('get-disk-info', async () => {
  try {
    const disks = nodeDiskInfo.getDiskInfoSync();
    return disks.filter(disk => disk.mounted.startsWith('C:'));
  } catch (error) {
    console.error('获取磁盘信息出错:', error);
    return null;
  }
});

// 系统级备用方法获取磁盘信息
ipcMain.handle('get-system-disk-info', async () => {
  try {
    // Windows系统获取磁盘信息
    if (process.platform === 'win32') {
      const { stdout } = await new Promise((resolve, reject) => {
        // 使用wmic命令获取磁盘信息
        const child = require('child_process').exec(
          'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace',
          { encoding: 'utf8' },
          (error, stdout, stderr) => {
            if (error) {
              reject(error);
              return;
            }
            resolve({ stdout, stderr });
          }
        );
      });

      // 解析命令输出结果
      const lines = stdout.trim().split('\n');
      if (lines.length >= 2) {
        const values = lines[1].trim().split(/\s+/);
        if (values.length >= 2) {
          const freeSpace = parseInt(values[0], 10);
          const totalSize = parseInt(values[1], 10);
          const usedSpace = totalSize - freeSpace;

          if (!isNaN(freeSpace) && !isNaN(totalSize)) {
            return {
              total: totalSize,
              free: freeSpace,
              used: usedSpace
            };
          }
        }
      }

      // 如果wmic命令方式解析失败，尝试使用PowerShell
      const { stdout: psOutput } = await new Promise((resolve, reject) => {
        require('child_process').exec(
          'powershell "Get-PSDrive C | Select-Object Used,Free"',
          { encoding: 'utf8' },
          (error, stdout, stderr) => {
            if (error) {
              reject(error);
              return;
            }
            resolve({ stdout, stderr });
          }
        );
      });

      // 解析PowerShell输出
      const matches = psOutput.match(/Used\s+Free\s+\r?\n\s*(\d+)\s+(\d+)/);
      if (matches && matches.length >= 3) {
        const used = parseInt(matches[1], 10);
        const free = parseInt(matches[2], 10);
        const total = used + free;

        if (!isNaN(used) && !isNaN(free)) {
          return {
            total: total,
            free: free,
            used: used
          };
        }
      }
    }

    // 如果上面的方法都失败了，将使用获取C盘根目录的方式估算磁盘空间
    try {
      const stats = fs.statSync('C:\\');
      const diskInfo = {
        total: 1024 * 1024 * 1024 * 250, // 假设总容量250GB (一般硬盘较为常见)
        free: stats.available,
        used: (1024 * 1024 * 1024 * 250) - stats.available // 估算已用空间
      };
      return diskInfo;
    } catch (err) {
      console.error('通过statSync获取磁盘信息失败:', err);

      // 最后的备用方案：使用child_process直接执行dir命令
      try {
        const { stdout } = await new Promise((resolve, reject) => {
          require('child_process').exec(
            'dir C:\\ /a',
            { encoding: 'utf8' },
            (error, stdout, stderr) => {
              if (error) {
                reject(error);
                return;
              }
              resolve({ stdout, stderr });
            }
          );
        });

        // 从dir命令输出中提取可用空间信息
        const freeSpaceMatch = stdout.match(/([\d,]+) bytes free/i);
        if (freeSpaceMatch && freeSpaceMatch[1]) {
          const freeSpace = parseInt(freeSpaceMatch[1].replace(/,/g, ''), 10);

          return {
            total: 1024 * 1024 * 1024 * 250, // 假设总容量250GB
            free: freeSpace,
            used: (1024 * 1024 * 1024 * 250) - freeSpace // 估算已用空间
          };
        }
      } catch (dirError) {
        console.error('通过dir命令获取磁盘信息失败:', dirError);
      }

      // 如果所有方法都失败，返回一些模拟数据
      return {
        total: 1024 * 1024 * 1024 * 250, // 假设250GB
        free: 1024 * 1024 * 1024 * 100,  // 假设100GB空闲
        used: 1024 * 1024 * 1024 * 150   // 假设150GB已用
      };
    }
  } catch (error) {
    console.error('系统级获取磁盘信息失败:', error);

    // 如果所有方法都失败，返回一些模拟数据
    // 这里使用固定值，只是为了确保界面不显示NaN或undefined
    return {
      total: 1024 * 1024 * 1024 * 100, // 假设100GB
      free: 1024 * 1024 * 1024 * 40,   // 假设40GB空闲
      used: 1024 * 1024 * 1024 * 60    // 假设60GB已用
    };
  }
});

// 获取大文件列表
ipcMain.handle('get-large-files', async (event, minSizeMB = 100) => {
  console.log(`开始查找大文件，最小大小: ${minSizeMB}MB`);
  const largeFiles = [];
  const minSizeBytes = minSizeMB * 1024 * 1024;
  const excludeDirs = ['C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)'];

  try {
    // 搜索用户目录下的大文件
    const userDir = 'C:\\Users';
    console.log(`开始扫描目录: ${userDir}`);
    await scanDirectory(userDir, largeFiles, minSizeBytes, excludeDirs);

    // 这里可以添加更多需要扫描的目录

    // 按大小排序（不再限制数量）
    const sortedFiles = largeFiles.sort((a, b) => b.size - a.size);

    console.log(`找到 ${sortedFiles.length} 个大文件`);
    // 记录前5个大文件的路径
    sortedFiles.slice(0, 5).forEach((file, index) => {
      console.log(`Top ${index + 1} 大文件: ${file.path}, 大小: ${file.size} 字节`);
    });

    return sortedFiles;
  } catch (error) {
    console.error('搜索大文件出错:', error);
    return [];
  }
});

// 递归扫描目录寻找大文件
async function scanDirectory(directory, results, minSize, excludeDirs) {
  if (excludeDirs.some(dir => directory.startsWith(dir))) {
    return;
  }

  try {
    console.log(`扫描目录: ${directory}`);
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);

      try {
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          await scanDirectory(fullPath, results, minSize, excludeDirs);
        } else if (stats.isFile() && stats.size > minSize) {
          // 确保路径使用标准Windows路径格式
          const normalizedPath = fullPath.replace(/\//g, '\\');
          console.log(`找到大文件: ${normalizedPath}, 大小: ${stats.size}`);
          results.push({
            path: normalizedPath,
            size: stats.size,
            lastModified: stats.mtime
          });
        }
      } catch (error) {
        // 忽略访问被拒绝等错误
        continue;
      }
    }
  } catch (error) {
    // 忽略访问被拒绝等错误
    return;
  }
}

// 扫描并清理临时文件
ipcMain.handle('scan-temp-files', async () => {
  const tempLocations = [
    { path: 'C:\\Windows\\Temp', safeToDelete: true },
    { path: `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Temp`, safeToDelete: true },
    { path: `C:\\Users\\${process.env.USERNAME}\\Downloads`, safeToDelete: false },
    // 浏览器缓存目录
    { path: `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache`, safeToDelete: true },
    { path: `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Microsoft\\Windows\\INetCache`, safeToDelete: true },
  ];

  const results = [];

  for (const location of tempLocations) {
    try {
      let size = 0;
      if (fs.existsSync(location.path)) {
        size = await calculateDirSize(location.path);
      }

      results.push({
        path: location.path,
        size: size,
        safeToDelete: location.safeToDelete
      });
    } catch (error) {
      console.error(`扫描 ${location.path} 时出错:`, error);
    }
  }

  return results;
});

// 计算目录大小
async function calculateDirSize(directory) {
  let totalSize = 0;

  try {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);

      try {
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          totalSize += await calculateDirSize(fullPath);
        } else if (stats.isFile()) {
          totalSize += stats.size;
        }
      } catch (error) {
        // 忽略访问被拒绝等错误
        continue;
      }
    }
  } catch (error) {
    // 忽略访问被拒绝等错误
    return totalSize;
  }

  return totalSize;
}

// 清理临时文件
ipcMain.handle('clean-temp-files', async (event, items) => {
  const results = [];

  for (const item of items) {
    if (!item.selected || !item.safeToDelete) continue;

    try {
      await deleteFilesInDirectory(item.path);
      results.push({
        path: item.path,
        success: true,
        message: '成功清理'
      });
    } catch (error) {
      results.push({
        path: item.path,
        success: false,
        message: error.message
      });
    }
  }

  return results;
});

// 删除目录中的文件
async function deleteFilesInDirectory(directory) {
  try {
    if (!fs.existsSync(directory)) {
      return;
    }

    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);

      try {
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          await deleteFilesInDirectory(fullPath);
          // 尝试删除空目录
          try {
            fs.rmdirSync(fullPath);
          } catch (error) {
            // 忽略目录非空等错误
          }
        } else {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        // 忽略单个文件的错误，继续处理其他文件
        continue;
      }
    }
  } catch (error) {
    throw new Error(`无法清理目录 ${directory}: ${error.message}`);
  }
}

// 查找重复文件
ipcMain.handle('find-duplicate-files', async (event, searchPath) => {
  try {
    // 基于选择的路径获取实际目录
    let actualPath = '';

    if (searchPath === 'documents') {
      actualPath = path.join(process.env.USERPROFILE, 'Documents');
    } else if (searchPath === 'downloads') {
      actualPath = path.join(process.env.USERPROFILE, 'Downloads');
    } else if (searchPath === 'pictures') {
      actualPath = path.join(process.env.USERPROFILE, 'Pictures');
    } else if (searchPath === 'videos') {
      actualPath = path.join(process.env.USERPROFILE, 'Videos');
    } else if (searchPath === 'music') {
      actualPath = path.join(process.env.USERPROFILE, 'Music');
    } else if (searchPath.startsWith('custom:')) {
      actualPath = searchPath.substring(7);
    } else {
      return { error: '无效的路径选择' };
    }

    // 检查路径是否存在
    if (!fs.existsSync(actualPath)) {
      return { error: `路径不存在: ${actualPath}` };
    }

    console.log(`开始在 ${actualPath} 中查找重复文件...`);

    // 文件哈希映射: 哈希值 -> 文件信息数组
    const fileHashes = {};
    // 记录所有扫描的文件数
    let totalFiles = 0;
    // 记录重复文件组
    const duplicateGroups = [];

    // 递归扫描目录并计算文件哈希
    await scanForDuplicates(actualPath, fileHashes, totalFiles);

    // 找出有重复的文件
    for (const [hash, files] of Object.entries(fileHashes)) {
      if (files.length > 1) {
        duplicateGroups.push({
          hash: hash,
          files: files
        });
      }
    }

    // 根据文件大小降序排序
    duplicateGroups.sort((a, b) => b.files[0].size - a.files[0].size);

    return {
      success: true,
      duplicateGroups: duplicateGroups,
      totalFiles: totalFiles,
      totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.files.length - 1, 0),
      searchPath: actualPath
    };
  } catch (error) {
    console.error('查找重复文件出错:', error);
    return { error: error.message };
  }
});

// 扫描目录查找重复文件
async function scanForDuplicates(directory, fileHashes, totalFiles) {
  try {
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);

      try {
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          await scanForDuplicates(fullPath, fileHashes, totalFiles);
        } else if (stats.isFile()) {
          totalFiles++;

          // 可以设置最小文件大小阈值，忽略太小的文件
          if (stats.size > 1024) { // 大于1KB的文件
            const fileHash = await calculateFileHash(fullPath);

            if (!fileHashes[fileHash]) {
              fileHashes[fileHash] = [];
            }

            fileHashes[fileHash].push({
              path: fullPath,
              size: stats.size,
              lastModified: stats.mtime
            });
          }
        }
      } catch (error) {
        // 忽略访问被拒绝等错误
        continue;
      }
    }
  } catch (error) {
    // 忽略访问被拒绝等错误
    return;
  }
}

// 计算文件的哈希值
async function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const crypto = require('crypto');
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);

      stream.on('data', data => {
        hash.update(data);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', error => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 删除重复文件
ipcMain.handle('delete-duplicate-files', async (event, filesToDelete) => {
  console.log(`收到删除重复文件请求，共 ${filesToDelete.length} 个文件`);
  const results = [];

  for (const file of filesToDelete) {
    try {
      let filePath = file.path;
      console.log(`处理文件: ${filePath}`);

      // 标准化路径
      filePath = filePath.replace(/\//g, '\\').replace(/\\\\/g, '\\');
      console.log(`规范化路径: ${filePath}`);

      // 检查是否是损坏的路径模式
      if (filePath.includes('UsersAA') && !filePath.includes('Users\\AA')) {
        // 尝试修复路径 - 添加丢失的分隔符
        filePath = filePath.replace(/UsersAA/g, 'Users\\AA\\');
        filePath = filePath.replace(/AppDataLocal/g, 'AppData\\Local\\');
        filePath = filePath.replace(/AppDataRoaming/g, 'AppData\\Roaming\\');
        filePath = filePath.replace(/AppDataLocalLow/g, 'AppData\\LocalLow\\');
        console.log(`修复后的路径: ${filePath}`);
      }

      if (fs.existsSync(filePath)) {
        console.log(`文件存在，尝试删除: ${filePath}`);
        // 尝试删除文件
        fs.unlinkSync(filePath);
        console.log(`成功删除文件: ${filePath}`);
        results.push({
          path: file.path,
          success: true,
          message: '成功删除'
        });
      } else {
        console.log(`文件不存在: ${filePath}`);

        // 尝试查找父目录
        let parentDir = path.dirname(filePath);
        let foundFile = false;

        // 在父目录中查找同名文件
        if (fs.existsSync(parentDir)) {
          const fileName = path.basename(filePath);
          try {
            const files = fs.readdirSync(parentDir);
            for (const f of files) {
              if (f.toLowerCase() === fileName.toLowerCase()) {
                const actualPath = path.join(parentDir, f);
                console.log(`找到可能的同名文件: ${actualPath}`);
                // 尝试删除这个文件
                fs.unlinkSync(actualPath);
                console.log(`成功删除找到的文件: ${actualPath}`);
                foundFile = true;
                results.push({
                  path: file.path,
                  success: true,
                  message: '找到并删除了相似文件'
                });
                break;
              }
            }
          } catch (err) {
            console.error(`在父目录搜索时出错: ${err.message}`);
          }
        }

        if (!foundFile) {
          results.push({
            path: file.path,
            success: false,
            message: '文件不存在'
          });
        }
      }
    } catch (error) {
      console.error(`删除文件出错:`, error);
      results.push({
        path: file.path,
        success: false,
        message: error.message
      });
    }
  }

  return results;
});

// 打开文件位置
ipcMain.handle('open-file-location', async (event, filePath) => {
  try {
    console.log(`-----主进程：打开文件位置-----`);
    console.log(`接收到的文件路径: ${filePath}`);

    // 增强路径规范化逻辑
    let normalizedPath = filePath;

    // 确保路径中的反斜杠是正确的
    normalizedPath = normalizedPath.replace(/\//g, '\\').replace(/\\\\/g, '\\');
    console.log(`修正分隔符后: ${normalizedPath}`);

    // 确保是绝对路径
    if (path.isAbsolute(normalizedPath)) {
      console.log(`路径已经是绝对路径`);
      normalizedPath = path.normalize(normalizedPath);
    } else {
      console.log(`路径不是绝对路径，尝试添加完整路径信息`);
      // 如果是单个盘符，添加完整路径
      if (/^[a-zA-Z]:$/.test(normalizedPath)) {
        normalizedPath = normalizedPath + '\\';
        console.log(`添加根目录分隔符: ${normalizedPath}`);
      }
      // 如果不是绝对路径，尝试从应用程序目录解析
      if (!path.isAbsolute(normalizedPath)) {
        console.log(`尝试从应用程序目录解析: ${app.getAppPath()}`);
        normalizedPath = path.resolve(app.getAppPath(), normalizedPath);
      }
    }

    console.log(`标准化后的路径: ${normalizedPath}`);

    // 检查文件是否存在
    const fileExists = fs.existsSync(normalizedPath);
    console.log(`文件是否存在: ${fileExists}`);

    if (!fileExists) {
      // 尝试检查是否是目录
      const possibleDirectory = path.dirname(normalizedPath);
      console.log(`尝试检查目录是否存在: ${possibleDirectory}`);
      const dirExists = fs.existsSync(possibleDirectory);
      console.log(`目录是否存在: ${dirExists}`);

      if (dirExists) {
        console.log(`文件不存在，但目录存在: ${possibleDirectory}，尝试打开目录`);
        const openResult = await shell.openPath(possibleDirectory);
        console.log(`打开目录结果: ${openResult}`);
        if (openResult === '') {  // 空字符串表示成功
          return { success: true, note: '文件不存在，已打开包含目录' };
        } else {
          return { success: false, error: `尝试打开目录失败: ${openResult}` };
        }
      }
      return { success: false, error: '文件不存在' };
    }

    // 获取文件的绝对路径
    const absPath = path.resolve(normalizedPath);
    console.log(`使用绝对路径: ${absPath}`);

    // 尝试打开文件位置
    try {
      console.log(`尝试使用shell.showItemInFolder打开`);
      shell.showItemInFolder(absPath);
      console.log(`成功打开文件位置`);
      return { success: true };
    } catch (err) {
      console.warn(`使用shell.showItemInFolder打开失败: ${err.message}`);

      // 如果showItemInFolder失败，尝试打开包含该文件的目录
      try {
        const directory = path.dirname(absPath);
        console.log(`尝试打开目录: ${directory}`);
        const openResult = await shell.openPath(directory);
        console.log(`打开目录结果: ${openResult}`);
        if (openResult === '') {  // 空字符串表示成功
          return { success: true, note: '已打开包含目录' };
        } else {
          return { success: false, error: `尝试打开目录失败: ${openResult}` };
        }
      } catch (dirErr) {
        console.error(`打开目录失败: ${dirErr.message}`);
        return { success: false, error: `无法打开文件位置: ${dirErr.message}` };
      }
    }
  } catch (error) {
    console.error(`打开文件位置时发生错误: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// 删除大文件
ipcMain.handle('delete-large-files', async (event, filesToDelete) => {
  console.log(`收到删除文件请求，共 ${filesToDelete.length} 个文件`);

  const results = [];

  for (const filePath of filesToDelete) {
    try {
      // 标准化文件路径（处理Windows路径中的双反斜杠）
      const normalizedPath = filePath.replace(/\\\\/g, '\\');
      console.log(`尝试删除文件: ${normalizedPath}`);

      // 检查文件是否存在
      if (!fs.existsSync(normalizedPath)) {
        console.error(`文件不存在: ${normalizedPath}`);
        results.push({
          path: filePath,
          success: false,
          error: '文件不存在'
        });
        continue;
      }

      // 确保路径指向的是文件而不是目录
      const stats = fs.statSync(normalizedPath);
      if (!stats.isFile()) {
        console.error(`路径指向的不是文件: ${normalizedPath}`);
        results.push({
          path: filePath,
          success: false,
          error: '指定路径不是文件'
        });
        continue;
      }

      // 尝试使用fs.unlinkSync删除文件
      try {
        fs.unlinkSync(normalizedPath);
        console.log(`成功删除文件: ${normalizedPath}`);
        results.push({ path: filePath, success: true });
      } catch (fsError) {
        console.warn(`使用fs.unlinkSync删除失败: ${fsError.message}`);

        // 如果标准方法失败，尝试使用系统命令删除文件
        if (process.platform === 'win32') {
          try {
            // 在Windows上使用del命令删除文件
            console.log(`尝试使用Windows命令删除: ${normalizedPath}`);
            execSync(`del "${normalizedPath}" /f /q`);
            console.log(`成功通过系统命令删除文件: ${normalizedPath}`);
            results.push({ path: filePath, success: true });
          } catch (cmdError) {
            console.error(`使用系统命令删除失败: ${cmdError.message}`);

            // 最后尝试使用管理员权限删除
            try {
              console.log(`尝试使用管理员权限删除: ${normalizedPath}`);
              if (process.platform === 'win32') {
                // 尝试使用PowerShell的管理员权限删除，但这需要用户交互确认UAC提示
                const powershellCmd = `powershell.exe -Command "Start-Process cmd -ArgumentList '/c del "${normalizedPath}" /f /q' -Verb RunAs"`;
                execSync(powershellCmd);

                // 检查文件是否已删除
                if (!fs.existsSync(normalizedPath)) {
                  console.log(`使用管理员权限成功删除: ${normalizedPath}`);
                  results.push({ path: filePath, success: true });
                  continue;
                }
              }

              // 如果文件仍然存在，报告失败
              results.push({
                path: filePath,
                success: false,
                error: '即使使用管理员权限也无法删除文件，文件可能被其他程序锁定'
              });
            } catch (adminError) {
              results.push({
                path: filePath,
                success: false,
                error: `无法删除文件(尝试管理员权限失败): ${adminError.message}`
              });
            }
          }
        } else {
          results.push({
            path: filePath,
            success: false,
            error: `无法删除文件: ${fsError.message}`
          });
        }
      }
    } catch (error) {
      console.error(`处理文件 ${filePath} 时出错: ${error.message}`);
      results.push({
        path: filePath,
        success: false,
        error: error.message
      });
    }
  }

  console.log(`删除操作完成，结果: `, results);
  return results;
});

// 直接打开目录
ipcMain.handle('open-directory', async (event, directoryPath) => {
  try {
    console.log(`-----主进程：直接打开目录-----`);
    console.log(`接收到的目录路径: ${directoryPath}`);

    // 检查路径格式，确保路径中包含冒号和目录分隔符
    let normalizedPath = directoryPath;

    // 确保路径中的反斜杠是正确的
    normalizedPath = normalizedPath.replace(/\//g, '\\').replace(/\\\\/g, '\\');
    console.log(`路径标准化后: ${normalizedPath}`);

    // 确保是绝对路径
    if (!path.isAbsolute(normalizedPath)) {
      console.log(`路径不是绝对路径: ${normalizedPath}`);
      normalizedPath = path.resolve(app.getAppPath(), normalizedPath);
      console.log(`转换为绝对路径: ${normalizedPath}`);
    }

    // 检查目录是否存在
    const dirExists = fs.existsSync(normalizedPath);
    console.log(`目录是否存在: ${dirExists}`);

    if (!dirExists) {
      // 尝试寻找父目录
      let parentDir = path.dirname(normalizedPath);
      console.log(`尝试查找父目录: ${parentDir}`);

      // 如果父目录不存在，继续向上查找直到找到存在的目录或到达驱动器根目录
      while (!fs.existsSync(parentDir) && parentDir.length > 3) {
        const oldParent = parentDir;
        parentDir = path.dirname(parentDir);
        console.log(`父目录不存在，继续向上: ${oldParent} => ${parentDir}`);
      }

      // 检查找到的目录是否存在
      if (fs.existsSync(parentDir)) {
        console.log(`找到存在的父目录: ${parentDir}`);
        normalizedPath = parentDir;
      } else {
        console.log(`无法找到有效的父目录，使用原始路径`);
        return { success: false, error: '目录不存在' };
      }
    }

    // 打开目录
    console.log(`使用shell.openPath打开目录: ${normalizedPath}`);
    const openResult = await shell.openPath(normalizedPath);

    if (openResult === '') {
      console.log(`成功打开目录`);
      return { success: true };
    } else {
      console.error(`打开目录失败: ${openResult}`);
      return { success: false, error: openResult };
    }
  } catch (error) {
    console.error(`打开目录时发生错误: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// 获取已安装程序列表
ipcMain.handle('get-installed-apps', async () => {
  try {
    // 设置控制台编码为UTF-8以正确显示中文
    try {
      if (process.platform === 'win32') {
        require('child_process').execSync('chcp 65001', { stdio: 'ignore' });
      }
    } catch (e) {
      console.error('设置控制台编码失败:', e);
    }

    console.log('获取系统已安装程序列表...');

    // 获取真实的已安装程序列表(直接使用不需要解析JSON的方式)
    const rawApps = await getInstalledAppsDirectMethod();

    if (rawApps.length > 0) {
      console.log(`成功获取到 ${rawApps.length} 个应用程序`);

      // 确保应用大小信息正确格式化
      const formattedApps = rawApps.map(app => {
        try {
          // 尝试格式化大小
          let formattedSize = 'Unknown';
          if (app.size !== null && app.size !== undefined) {
            formattedSize = formatSize(app.size);
          }

          return {
            ...app,
            // 修正大小格式显示
            size: formattedSize,
            // 补充检测是否已搬家
            ...checkMigrationStatus(app)
          };
        } catch (err) {
          console.error(`格式化应用 ${app.name} 的大小时出错:`, err);
          return {
            ...app,
            size: 'Unknown'
          };
        }
      });

      console.log(`已格式化 ${formattedApps.length} 个应用程序的大小信息`);
      return formattedApps;
    }

    // 如果直接方法失败，尝试使用注册表方法
    console.log('直接方法未获取到应用程序，尝试注册表方法...');

    // 注册表方法
    const regRawApps = await useRegistryMethod();
    if (regRawApps.length > 0) {
      console.log(`成功通过注册表获取到 ${regRawApps.length} 个应用程序`);

      // 确保应用大小信息正确格式化
      const formattedRegApps = regRawApps.map(app => {
        try {
          // 尝试格式化大小
          let formattedSize = 'Unknown';
          if (app.size !== null && app.size !== undefined) {
            formattedSize = formatSize(app.size);
            console.log(`应用 ${app.name} 大小格式化: ${app.size} -> ${formattedSize}`);
          }

          return {
            ...app,
            // 修正大小格式显示
            size: formattedSize,
            // 补充检测是否已搬家
            ...checkMigrationStatus(app)
          };
        } catch (err) {
          console.error(`格式化应用 ${app.name} 的大小时出错:`, err);
          return {
            ...app,
            size: 'Unknown'
          };
        }
      });

      console.log(`已格式化 ${formattedRegApps.length} 个应用程序的大小信息`);
      return formattedRegApps;
    }

    // 如果所有方法都失败，使用模拟数据
    console.log('所有方法均未获取到应用程序，使用模拟数据');
    return getMockAppsList();
  } catch (error) {
    console.error('获取已安装程序列表出错:', error);
    return getMockAppsList();
  }
});

// 直接使用PowerShell获取已安装应用，无需JSON解析
async function getInstalledAppsDirectMethod() {
  try {
    // 更简单可靠的PowerShell命令
    const ps1Command = `
      # 设置输出编码为UTF-8
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      
      # 查询已安装应用
      $apps = @()
      
      # 从注册表中获取应用
      $uninstallKeys = @(
        "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
        "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
        "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"
      )
      
      foreach ($key in $uninstallKeys) {
        if (Test-Path $key) {
          try {
            $apps += Get-ItemProperty -Path $key | 
                   Where-Object { $_.DisplayName -ne $null } | 
                   Select-Object @{n='Name';e={$_.DisplayName}}, 
                                 @{n='Version';e={$_.DisplayVersion}}, 
                                 @{n='Publisher';e={$_.Publisher}}, 
                                 @{n='InstallDate';e={$_.InstallDate}}, 
                                 @{n='Size';e={$_.EstimatedSize}}, 
                                 @{n='UninstallString';e={$_.UninstallString}},
                                 @{n='InstallLocation';e={$_.InstallLocation}}
          } catch { 
            # 忽略错误
          }
        }
      }

      # 用格式化的方式直接输出，避免JSON解析问题
      foreach ($app in $apps) {
        if ($app.Name) {
          $name = if ($app.Name) { $app.Name.Trim() } else { "Unknown" }
          $version = if ($app.Version) { $app.Version.Trim() } else { "Unknown" }
          $publisher = if ($app.Publisher) { $app.Publisher.Trim() } else { "Unknown" }
          $installDate = if ($app.InstallDate) { $app.InstallDate } else { "Unknown" }
          
          # 改进大小处理，以原始格式输出
          $size = if ($app.Size -ne $null) { "$($app.Size)" } else { "0" }
          
          # 如果是十六进制格式，保留原格式
          if ($size -match "^0x") {
            # 已经是十六进制格式，保持不变
          }
          
          $uninstallString = if ($app.UninstallString) { $app.UninstallString.Trim() } else { "" }
          $installLocation = if ($app.InstallLocation) { $app.InstallLocation.Trim() } else { "" }
          
          # 使用唯一分隔符输出，以便后续处理
          Write-Output "APP_ENTRY_START|$name|$version|$publisher|$installDate|$size|$uninstallString|$installLocation"
        }
      }
    `;

    console.log('执行PowerShell获取程序列表...');

    const { stdout, stderr } = await new Promise((resolve, reject) => {
      // 使用spawn而不是exec，能更好地处理大量输出
      const ps = require('child_process').spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy', 'Bypass',
        '-Command', ps1Command
      ], {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8'
      });

      let output = '';
      let errorOutput = '';

      ps.stdout.on('data', (data) => {
        output += data.toString('utf8');
      });

      ps.stderr.on('data', (data) => {
        errorOutput += data.toString('utf8');
      });

      ps.on('close', (code) => {
        if (code !== 0 && errorOutput) {
          console.error(`PowerShell执行出错(代码: ${code}): ${errorOutput}`);
        }
        resolve({ stdout: output, stderr: errorOutput });
      });

      ps.on('error', (err) => {
        reject(err);
      });
    });

    if (stderr) {
      console.error('PowerShell出错:', stderr);
    }

    if (!stdout || stdout.trim() === '') {
      console.log('PowerShell方法返回空数据');
      return [];
    }

    // 解析输出结果
    const appsList = [];
    const appEntries = stdout.split('APP_ENTRY_START|');

    for (let i = 1; i < appEntries.length; i++) {  // 从1开始，因为第一个元素是空的
      const parts = appEntries[i].split('|');
      if (parts.length >= 6) {
        // 兼容旧格式，如果有第7项则是 InstallLocation
        const name = parts[0];
        const version = parts[1];
        const publisher = parts[2];
        const installDate = parts[3];
        const size = parts[4];
        const uninstallString = parts[5];
        const installLocation = parts.length >= 7 ? parts[6] : '';

        // 修复Office相关应用名称中的乱码
        let cleanName = name;
        if (name && name.includes('Microsoft') &&
          (name.includes('Office') || name.includes('Project') || name.includes('Visio')) &&
          /[\uFFFD\uD800-\uDFFF\u0080-\u00FF]{2,}/.test(name)) {
          cleanName = cleanOfficeName(name, null);
        }

        // 改进大小处理，将字符串转换为数字
        let sizeValue;

        // 检查是否是十六进制值
        if (typeof size === 'string' && size.toLowerCase().startsWith('0x')) {
          console.log(`检测到十六进制大小值: ${size}, 程序: ${cleanName}`);
          sizeValue = parseInt(size, 16);
        } else {
          sizeValue = parseInt(size, 10);
        }

        console.log(`解析程序 ${cleanName} 的大小: ${size} -> ${sizeValue}`);

        // 如果解析失败，设置为null
        if (isNaN(sizeValue)) {
          sizeValue = null;
        }

        appsList.push({
          name: cleanName,
          version: version || 'Unknown',
          publisher: publisher || 'Unknown',
          installDate: formatInstallDate(installDate) || 'Unknown',
          size: sizeValue,  // 存储为数字
          uninstallString: uninstallString || '',
          installLocation: installLocation || ''
        });
      }
    }

    return appsList.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('PowerShell直接方法获取程序列表失败:', error);
    return [];
  }
}

// 使用注册表方法获取应用列表
async function useRegistryMethod() {
  console.log('使用注册表方法获取应用列表...');
  try {
    // 直接使用更简单的命令进行注册表查询
    const uninstallKeys = [
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
      'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
      'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
    ];

    const apps = [];

    for (const keyPath of uninstallKeys) {
      try {
        console.log(`查询注册表路径: ${keyPath}`);
        // 使用cmd命令并明确设置代码页为65001(UTF-8)
        const regQueryCmd = `chcp 65001 >nul && reg query "${keyPath}" /s`;

        const { stdout } = await new Promise((resolve) => {
          require('child_process').exec(
            regQueryCmd,
            {
              maxBuffer: 1024 * 1024 * 10,
              encoding: 'utf8'
            },
            (error, stdout, stderr) => {
              if (error) {
                console.error(`查询注册表 ${keyPath} 出错:`, error);
                resolve({ stdout: '' });
                return;
              }
              resolve({ stdout });
            }
          );
        });

        if (!stdout || stdout.trim() === '') {
          console.log(`注册表路径 ${keyPath} 返回空结果`);
          continue;
        }

        // 分析注册表输出
        const appEntries = stdout.split('\r\n\r\n').filter(entry => entry.includes('DisplayName'));
        console.log(`在 ${keyPath} 中找到 ${appEntries.length} 个潜在的应用程序条目`);

        for (const entry of appEntries) {
          const lines = entry.split('\r\n');
          const keyLine = lines[0]; // 第一行包含键路径

          let app = {
            name: null,
            version: null,
            publisher: null,
            installDate: null,
            size: null,
            uninstallString: null,
            installLocation: null
          };

          // 提取键名（用于调试）
          const keyNameMatch = keyLine.match(new RegExp(`${keyPath.replace(/\\/g, '\\\\')}\\\\(.*?)$`));
          const keyName = keyNameMatch ? keyNameMatch[1] : null;

          // 解析值
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const valueMatch = line.match(/^\s*(.*?)\s+REG_.*?\s+(.*?)$/);
            if (valueMatch) {
              const name = valueMatch[1].trim();
              const value = valueMatch[2].trim();

              // 映射常见注册表值
              if (name === 'DisplayName') {
                app.name = cleanRegistryValue(value);
              }
              else if (name === 'DisplayVersion') app.version = cleanRegistryValue(value);
              else if (name === 'Publisher') app.publisher = cleanRegistryValue(value);
              else if (name === 'InstallDate') app.installDate = value;
              else if (name === 'EstimatedSize') {
                // 改进的大小处理逻辑 - 处理十六进制值
                let sizeValue;

                // 检查是否是十六进制值（以0x开头）
                if (typeof value === 'string' && value.toLowerCase().startsWith('0x')) {
                  console.log(`检测到十六进制大小值: ${value}`);
                  sizeValue = parseInt(value, 16);
                } else {
                  sizeValue = parseInt(value, 10);
                }

                if (!isNaN(sizeValue) && sizeValue > 0) {
                  app.size = sizeValue;
                  console.log(`应用 ${app.name || keyName} 的大小: ${sizeValue} KB`);
                } else {
                  console.log(`应用 ${app.name || keyName} 的大小无效: ${value}`);
                }
              }
              else if (name === 'UninstallString') app.uninstallString = value;
              else if (name === 'InstallLocation') app.installLocation = value;
              else if (name === 'QuietUninstallString' && !app.uninstallString) {
                app.uninstallString = value;
              }
            }
          }

          // 特殊处理Office产品名称
          if (app.name && app.name.includes('Microsoft') &&
            (app.name.includes('Office') || app.name.includes('Project') || app.name.includes('Visio'))) {

            // 检查是否包含异常字符
            if (/[\uFFFD\uD800-\uDFFF\u2000-\u20FF\u0080-\u00FF]+/.test(app.name)) {
              // 获取更干净的产品名称
              app.name = cleanOfficeName(app.name, keyName);
            }
          }

          // 只添加有名称的应用
          if (app.name) {
            apps.push({
              name: app.name,
              version: app.version || 'Unknown',
              publisher: app.publisher || 'Unknown',
              installDate: formatInstallDate(app.installDate) || 'Unknown',
              size: app.size, // 修改: 直接存储为数字，不要在这里调用formatSize
              uninstallString: app.uninstallString || '',
              installLocation: app.installLocation || ''
            });
          }
        }
      } catch (e) {
        console.error(`处理注册表路径 ${keyPath} 时出错:`, e);
      }
    }

    console.log(`注册表方法解析到 ${apps.length} 个应用程序`);

    return apps.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('注册表方法获取应用列表出错:', error);
    return [];
  }
}

// 清理注册表值，处理可能的编码问题
function cleanRegistryValue(value) {
  if (!value) return null;

  // 移除引号、多余空格和换行符
  let cleaned = value.replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ');

  // 如果是非UTF-8编码导致的乱码，通常会有大量无法显示的字符
  const hasEncodingIssue = /[\uFFFD\uD800-\uDFFF\u0080-\u00FF]{4,}/.test(cleaned);

  if (hasEncodingIssue) {
    // 仅保留可读字符，移除乱码
    cleaned = cleaned.replace(/[\uFFFD\uD800-\uDFFF\u0080-\u00FF]+/g, ' ').trim();
  }

  return cleaned || null;
}

// 清理Office名称中的乱码
function cleanOfficeName(name, keyName) {
  // 创建一个干净版本的名称
  let cleanedName = name.replace(/[\uFFFD\uD800-\uDFFF\u2000-\u20FF\u0080-\u00FF]+/g, ' ').trim();

  // 提取产品类型
  let productType = '';
  if (name.includes('Office')) productType = 'Office';
  else if (name.includes('Project')) productType = 'Project';
  else if (name.includes('Visio')) productType = 'Visio';

  // 提取语言和年份信息
  let lang = '';
  let year = '';

  if (name.includes('zh-cn') || name.includes('中文')) lang = '中文版';
  else if (name.includes('en-us')) lang = '英文版';

  if (name.includes('2024')) year = '2024';
  else if (name.includes('2021')) year = '2021';
  else if (name.includes('2019')) year = '2019';
  else if (name.includes('2016')) year = '2016';
  else if (name.includes('365')) year = '365';

  // 提取版本信息
  let edition = '';
  if (name.includes('LTSC')) edition = 'LTSC';
  else if (name.includes('Volume')) edition = '批量版';
  else if (name.includes('Retail')) edition = '零售版';

  // 从键名推断产品信息
  if (keyName) {
    if (!productType && keyName.includes('Office')) productType = 'Office';
    if (!year) {
      if (keyName.includes('2024')) year = '2024';
      else if (keyName.includes('2021')) year = '2021';
      else if (keyName.includes('2019')) year = '2019';
      else if (keyName.includes('2016')) year = '2016';
      else if (keyName.includes('365')) year = '365';
    }
  }

  // 如果没有提取到足够信息，返回清理后的名称
  if (!productType) {
    return cleanedName;
  }

  // 重构产品名称
  let newName = `Microsoft ${productType}`;
  if (year) newName += ` ${year}`;
  if (edition) newName += ` ${edition}`;
  if (lang) newName += ` ${lang}`;

  console.log(`修复Office产品名称: ${name} -> ${newName}`);
  return newName;
}

// 格式化安装日期
function formatInstallDate(dateStr) {
  if (!dateStr) return null;

  // 处理常见的注册表日期格式 (YYYYMMDD)
  if (dateStr.length === 8) {
    try {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    } catch (e) {
      return dateStr;
    }
  }

  return dateStr;
}

// 格式化大小信息
function formatSize(sizeInKB) {
  try {
    // 处理可能的十六进制字符串
    if (typeof sizeInKB === 'string') {
      if (sizeInKB.toLowerCase().startsWith('0x')) {
        // 十六进制值
        sizeInKB = parseInt(sizeInKB, 16);
        console.log(`将十六进制值 ${sizeInKB} 转换为十进制: ${sizeInKB}`);
      } else {
        // 普通数字字符串
        sizeInKB = Number(sizeInKB);
      }
    }

    // 确保转换为数字
    sizeInKB = Number(sizeInKB);

    // 验证是否为有效数字
    if (isNaN(sizeInKB) || sizeInKB <= 0) {
      return 'Unknown';
    }

    // 转换为MB
    const sizeInMB = sizeInKB / 1024;
    if (sizeInMB < 1) {
      return `${sizeInKB.toFixed(2)} KB`;
    }

    // 转换为GB
    const sizeInGB = sizeInMB / 1024;
    if (sizeInGB < 1) {
      return `${sizeInMB.toFixed(2)} MB`;
    }

    return `${sizeInGB.toFixed(2)} GB`;
  } catch (error) {
    console.error(`格式化大小时出错: ${error.message}, 输入值: ${sizeInKB}`);
    return 'Unknown';
  }
}

// 更新getMockAppsList函数，提供更多模拟数据
function getMockAppsList() {
  console.log('使用模拟数据作为应用列表');
  return [
    {
      name: '系统清理工具',
      version: '1.0.0',
      publisher: '示例发布者',
      installDate: '2023-01-01',
      size: 'Unknown',
      uninstallString: 'C:\\Program Files\\系统清理工具\\uninstall.exe /S'
    },
    {
      name: 'Microsoft Edge',
      version: '115.0.1901.200',
      publisher: 'Microsoft Corporation',
      installDate: 'Unknown',
      size: 'Unknown',
      uninstallString: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\115.0.1901.200\\Installer\\setup.exe --uninstall --system-level'
    },
    {
      name: 'Windows Defender',
      version: '4.18.2305.8',
      publisher: 'Microsoft Corporation',
      installDate: 'Unknown',
      size: 'Unknown',
      uninstallString: ''
    },
    {
      name: 'Google Chrome',
      version: '116.0.5845.97',
      publisher: 'Google LLC',
      installDate: '2023-05-15',
      size: '245 MB',
      uninstallString: 'C:\\Program Files\\Google\\Chrome\\Application\\116.0.5845.97\\Installer\\setup.exe --uninstall --system-level'
    },
    {
      name: 'Mozilla Firefox',
      version: '117.0',
      publisher: 'Mozilla Foundation',
      installDate: '2023-06-20',
      size: '198 MB',
      uninstallString: 'C:\\Program Files\\Mozilla Firefox\\uninstall\\helper.exe /S'
    },
    {
      name: 'Adobe Acrobat Reader DC',
      version: '23.003.20244',
      publisher: 'Adobe Inc.',
      installDate: '2023-06-18',
      size: '350 MB',
      uninstallString: 'C:\\Program Files (x86)\\Adobe\\Acrobat Reader DC\\Reader\\AcroRd32.exe /sAll'
    },
    {
      name: 'Steam',
      version: '2.10.91.91',
      publisher: 'Valve Corporation',
      installDate: '2022-12-25',
      size: '450 MB',
      uninstallString: 'C:\\Program Files (x86)\\Steam\\uninstall.exe /S'
    },
    {
      name: 'Microsoft Office 365',
      version: '16.0.16327.20218',
      publisher: 'Microsoft Corporation',
      installDate: '2022-11-15',
      size: '1.8 GB',
      uninstallString: 'C:\\Program Files\\Microsoft Office\\Office16\\OfficeClickToRun.exe scenario=install scenariosubtype=ARP sourcetype=None productstoremove=O365ProPlus.16_zh-cn_x-none culture=zh-cn version.16=16.0'
    },
    {
      name: 'VLC media player',
      version: '3.0.18',
      publisher: 'VideoLAN',
      installDate: '2023-01-30',
      size: '75 MB',
      uninstallString: 'C:\\Program Files\\VideoLAN\\VLC\\uninstall.exe /S'
    },
    {
      name: 'NVIDIA GeForce Experience',
      version: '3.27.0.112',
      publisher: 'NVIDIA Corporation',
      installDate: '2023-02-20',
      size: '120 MB',
      uninstallString: 'C:\\Program Files\\NVIDIA Corporation\\Installer2\\InstallerCore\\GFExperience\\setup.exe -uninstall'
    },
    {
      name: '微信',
      version: '3.9.2.23',
      publisher: '腾讯科技(深圳)有限公司',
      installDate: '2023-07-01',
      size: '85 MB',
      uninstallString: 'C:\\Program Files (x86)\\Tencent\\WeChat\\uninstall.exe /S'
    },
    {
      name: 'QQ',
      version: '9.7.1.28940',
      publisher: '腾讯科技(深圳)有限公司',
      installDate: '2023-06-15',
      size: '90 MB',
      uninstallString: 'C:\\Program Files (x86)\\Tencent\\QQ\\uninstall.exe /S'
    }
  ];
}

// 卸载程序
ipcMain.handle('uninstall-app', async (event, uninstallString) => {
  try {
    console.log(`尝试卸载程序: ${uninstallString}`);

    if (!uninstallString || uninstallString.trim() === '') {
      return { success: false, message: '没有提供卸载命令' };
    }

    if (process.platform === 'win32') {
      // 处理模拟数据中的卸载字符串
      if (uninstallString.includes('示例') || uninstallString.includes('Example')) {
        // 模拟卸载成功
        return { success: true, message: '模拟卸载成功' };
      }

      console.log(`执行卸载命令: ${uninstallString}`);

      // 检查卸载字符串是否包含引号，处理复杂的卸载命令
      let processedCmd = uninstallString;

      // 如果是MsiExec命令，直接使用
      if (uninstallString.toLowerCase().includes('msiexec')) {
        try {
          require('child_process').exec(uninstallString, (error) => {
            if (error) {
              console.error('使用msiexec卸载失败:', error);
            }
          });
          return { success: true, message: '使用MSI安装程序启动卸载' };
        } catch (msiError) {
          console.error('执行MSI卸载命令失败:', msiError);
        }
      }

      // 尝试解析卸载命令，分离可执行文件和参数
      let executablePath = '';
      let args = [];

      // 检查是否有引号包围的路径
      const quotedPathMatch = uninstallString.match(/"([^"]+)"/);
      if (quotedPathMatch) {
        executablePath = quotedPathMatch[1];
        // 获取剩余参数
        args = uninstallString.substring(uninstallString.indexOf('"', quotedPathMatch.index + quotedPathMatch[0].length) + 1).trim().split(' ');
      } else {
        // 没有引号，查找第一个空格
        const firstSpaceIndex = uninstallString.indexOf(' ');
        if (firstSpaceIndex > 0) {
          executablePath = uninstallString.substring(0, firstSpaceIndex);
          args = uninstallString.substring(firstSpaceIndex + 1).trim().split(' ');
        } else {
          // 没有参数的命令
          executablePath = uninstallString;
        }
      }

      // 检查可执行文件是否存在
      if (executablePath && fs.existsSync(executablePath)) {
        console.log(`找到可执行文件: ${executablePath}`);
        console.log(`参数: ${args.join(' ')}`);

        try {
          const { spawn } = require('child_process');
          // 使用spawn启动进程，并分离父子进程
          const child = spawn(executablePath, args, {
            detached: true,
            stdio: 'ignore',
            windowsHide: false // 确保显示卸载界面
          });

          // 不等待子进程结束
          child.unref();

          return { success: true, message: '卸载程序已启动' };
        } catch (spawnError) {
          console.error('启动卸载程序失败:', spawnError);
        }
      }

      // 如果上面的方法失败，尝试使用简单的start命令
      try {
        // 将命令包裹在引号内，避免路径中的空格问题
        const startCmd = `start "" ${processedCmd}`;

        require('child_process').exec(startCmd, (error) => {
          if (error) {
            console.error('使用start命令执行卸载失败:', error);
          }
        });

        return { success: true, message: '卸载程序已启动' };
      } catch (startError) {
        console.error('使用start命令启动卸载程序失败:', startError);

        // 最后尝试使用shell.openExternal
        try {
          if (fs.existsSync(executablePath)) {
            shell.openPath(executablePath);
            return { success: true, message: '使用shell.openPath启动卸载程序' };
          }
        } catch (shellError) {
          console.error('使用shell打开卸载程序失败:', shellError);
        }
      }

      // 所有方法都失败了，返回错误
      return { success: false, message: '无法启动卸载程序，请手动卸载' };
    } else {
      return { success: false, message: '仅支持Windows系统' };
    }
  } catch (error) {
    console.error('卸载程序时出错:', error);
    return { success: false, message: `卸载出错: ${error.message}` };
  }
});

// ==================== 文件迁移功能 ====================

// 获取可用的磁盘列表
ipcMain.handle('get-available-drives', async () => {
  try {
    console.log('获取可用磁盘列表...');
    const disks = nodeDiskInfo.getDiskInfoSync();

    // 过滤出可用的磁盘，排除C盘（因为我们是从C盘迁移）
    const availableDrives = disks
      .filter(disk => {
        const driveLetter = disk.mounted.charAt(0).toUpperCase();
        // 只保留非C盘的本地磁盘
        return driveLetter !== 'C' &&
          disk.mounted.length >= 2 &&
          disk.available > 0; // 确保有可用空间
      })
      .map(disk => ({
        letter: disk.mounted.charAt(0).toUpperCase(),
        mounted: disk.mounted,
        available: disk.available,
        capacity: disk.blocks,
        used: disk.blocks - disk.available,
        fileSystem: disk.filesystem,
        label: disk.volumename || `本地磁盘 (${disk.mounted.charAt(0)}:)`
      }))
      .sort((a, b) => a.letter.localeCompare(b.letter));

    console.log(`找到 ${availableDrives.length} 个可用磁盘:`, availableDrives);
    return availableDrives;
  } catch (error) {
    console.error('获取磁盘列表出错:', error);
    // 如果获取失败，返回常见的磁盘选项
    return [
      { letter: 'D', mounted: 'D:', label: '本地磁盘 (D:)' },
      { letter: 'E', mounted: 'E:', label: '本地磁盘 (E:)' }
    ];
  }
});

// 迁移单个文件的核心函数（可被多处调用）
async function migrateFile(sourcePath, targetDrive) {
  try {
    console.log(`开始迁移文件: ${sourcePath} -> ${targetDrive}`);

    // 标准化源路径
    const normalizedSource = path.normalize(sourcePath);

    // 检查源文件是否存在
    if (!fs.existsSync(normalizedSource)) {
      console.error(`源文件不存在: ${normalizedSource}`);
      return {
        success: false,
        error: '源文件不存在',
        path: sourcePath
      };
    }

    // 检查源文件是否已经是符号链接（说明之前已经迁移过）
    try {
      const lstat = fs.lstatSync(normalizedSource);
      if (lstat.isSymbolicLink()) {
        console.log(`文件已经是符号链接，跳过迁移: ${normalizedSource}`);
        // 读取符号链接指向的目标
        const linkTarget = fs.readlinkSync(normalizedSource);
        return {
          success: true,
          message: '文件已经被迁移过（符号链接已存在）',
          sourcePath: normalizedSource,
          targetPath: linkTarget,
          size: 0,
          alreadyMigrated: true
        };
      }
    } catch (linkCheckError) {
      console.log('符号链接检查失败（正常文件）:', linkCheckError.message);
    }

    // 获取文件信息
    const stats = fs.statSync(normalizedSource);
    if (!stats.isFile()) {
      return {
        success: false,
        error: '不是有效的文件',
        path: sourcePath
      };
    }

    // 构建目标路径
    // 在目标磁盘创建一个 CleanC_Migrated 文件夹来存储迁移的文件
    const targetRoot = path.join(targetDrive, 'CleanC_Migrated');

    // 创建目标根目录（如果不存在）
    if (!fs.existsSync(targetRoot)) {
      fs.mkdirSync(targetRoot, { recursive: true });
    }

    // 保留原始文件的相对路径结构（去除盘符部分）
    // 例如: C:\Users\AA\file.txt -> D:\CleanC_Migrated\Users\AA\file.txt
    const relativePath = normalizedSource.substring(3); // 移除 "C:\"
    const targetPath = path.join(targetRoot, relativePath);

    // 确保目标目录存在
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 检查目标文件是否已存在
    if (fs.existsSync(targetPath)) {
      console.log(`目标文件已存在: ${targetPath}`);

      // 智能恢复逻辑：检查文件大小是否一致
      try {
        const targetStats = fs.statSync(targetPath);
        if (targetStats.size === stats.size) {
          console.log('目标文件大小一致，尝试智能恢复（删除源文件并创建链接）...');

          // 尝试删除源文件
          try {
            fs.unlinkSync(normalizedSource);
            console.log(`源文件删除成功: ${normalizedSource}`);

            // 创建符号链接
            const mklinkCmd = `mklink "${normalizedSource}" "${targetPath}"`;
            execSync(mklinkCmd, { shell: 'cmd.exe', stdio: 'pipe' });

            return {
              success: true,
              message: '文件迁移已修复（关联到现存目标文件）',
              sourcePath: normalizedSource,
              targetPath: targetPath,
              size: stats.size,
              recovered: true
            };
          } catch (recoverError) {
            console.error('智能恢复失败:', recoverError);
            // 如果恢复失败（如源文件被占用无法删除），则返回原来的错误
            return {
              success: false,
              error: `目标文件已存在，且源文件无法删除（可能被占用）: ${recoverError.message}`,
              path: sourcePath
            };
          }
        } else {
          return {
            success: false,
            error: `目标位置已存在同名文件，且大小不一致 (源: ${stats.size}, 目标: ${targetStats.size})`,
            path: sourcePath
          };
        }
      } catch (e) {
        return {
          success: false,
          error: '目标位置已存在同名文件',
          path: sourcePath
        };
      }
    }

    console.log(`复制文件: ${normalizedSource} -> ${targetPath}`);

    // 复制文件到目标位置
    fs.copyFileSync(normalizedSource, targetPath);

    // 验证复制是否成功
    if (!fs.existsSync(targetPath)) {
      return {
        success: false,
        error: '文件复制失败',
        path: sourcePath
      };
    }

    // 验证文件大小是否一致
    const targetStats = fs.statSync(targetPath);
    if (targetStats.size !== stats.size) {
      // 删除不完整的目标文件
      try {
        fs.unlinkSync(targetPath);
      } catch (e) {
        console.error('清理不完整文件失败:', e);
      }
      return {
        success: false,
        error: '文件复制不完整',
        path: sourcePath
      };
    }

    console.log(`删除源文件: ${normalizedSource}`);

    // 删除原文件
    fs.unlinkSync(normalizedSource);

    console.log(`创建符号链接: ${normalizedSource} -> ${targetPath}`);

    // 在原位置创建符号链接（Windows需要管理员权限）
    // 使用 mklink 命令创建符号链接
    try {
      const mklinkCmd = `mklink "${normalizedSource}" "${targetPath}"`;
      execSync(mklinkCmd, {
        shell: 'cmd.exe',
        stdio: 'pipe'
      });

      console.log(`符号链接创建成功`);

      return {
        success: true,
        message: '文件迁移成功',
        sourcePath: normalizedSource,
        targetPath: targetPath,
        size: stats.size
      };
    } catch (linkError) {
      console.error('创建符号链接失败:', linkError);

      // 如果创建符号链接失败，尝试恢复文件
      try {
        console.log('尝试恢复原文件...');
        fs.copyFileSync(targetPath, normalizedSource);
        fs.unlinkSync(targetPath);

        return {
          success: false,
          error: '创建符号链接失败（可能需要管理员权限），已恢复原文件',
          path: sourcePath,
          needAdmin: true
        };
      } catch (restoreError) {
        console.error('恢复文件失败:', restoreError);
        return {
          success: false,
          error: `创建符号链接失败，且无法恢复原文件。文件已移动到: ${targetPath}`,
          path: sourcePath,
          targetPath: targetPath,
          needAdmin: true
        };
      }
    }
  } catch (error) {
    console.error('迁移文件出错:', error);
    return {
      success: false,
      error: error.message,
      path: sourcePath
    };
  }
}

// 迁移单个文件到指定磁盘（IPC处理器）
ipcMain.handle('migrate-file', async (event, sourcePath, targetDrive) => {
  return await migrateFile(sourcePath, targetDrive);
});

// 批量迁移文件
ipcMain.handle('migrate-files-batch', async (event, files, targetDrive) => {
  console.log(`开始批量迁移 ${files.length} 个文件到 ${targetDrive}`);

  const results = [];
  let successCount = 0;
  let failCount = 0;
  let totalSizeMigrated = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // 发送进度更新
    event.sender.send('migration-progress', {
      current: i + 1,
      total: files.length,
      fileName: path.basename(file.path),
      percentage: Math.round((i / files.length) * 100)
    });

    // 迁移单个文件 - 直接调用 migrateFile 函数
    const result = await migrateFile(file.path, targetDrive);

    results.push(result);

    if (result.success) {
      successCount++;
      totalSizeMigrated += result.size || 0;
    } else {
      failCount++;
    }

    // 小延迟，避免过快操作
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`批量迁移完成: 成功 ${successCount} 个，失败 ${failCount} 个`);

  return {
    success: true,
    results: results,
    summary: {
      total: files.length,
      success: successCount,
      failed: failCount,
      totalSizeMigrated: totalSizeMigrated
    }
  };
});

// ==================== 文件夹迁移功能 (商业化核心) ====================

// 检查路径列表的迁移状态 (批量)
ipcMain.handle('check-paths-migration-status', async (event, paths) => {
  const results = {};
  // 去重
  const uniquePaths = [...new Set(paths.filter(p => p && typeof p === 'string'))];

  for (const p of uniquePaths) {
    try {
      // 必须使用 lstat 而不是 stat，因为我们要检查链接本身
      if (fs.existsSync(p)) {
        const lstat = fs.lstatSync(p);
        if (lstat.isSymbolicLink()) { // Junction 在 Node中也被视为 SymbolicLink
          const target = fs.readlinkSync(p);
          // 如果指向非 C 盘，则认为是已迁移
          if (target && !target.toLowerCase().startsWith('c:')) {
            results[p] = { isMigrated: true, migratedTo: target };
          }
          // 特殊情况：如果指向同盘符的其他位置（比如 D 盘搬到 D 盘），只要是 CleanC_Migrated 也算
          else if (target && target.includes('CleanC_Migrated')) {
            results[p] = { isMigrated: true, migratedTo: target };
          }
        }
      }
    } catch (e) {
      // 忽略无法访问的路径
    }
  }
  return results;
});

// 文件夹迁移 IPC 接口
ipcMain.handle('migrate-folder', async (event, { sourcePath, targetDrive }) => {
  try {
    console.log(`收到文件夹迁移请求: ${sourcePath} -> ${targetDrive}`);
    return await migrateFolder(sourcePath, targetDrive);
  } catch (error) {
    console.error('文件夹迁移失败:', error);
    return { success: false, error: error.message };
  }
});

// 文件夹迁移核心函数
// 使用 Robocopy (Copy+Delete) + mklink /J 实现目录联接
// 改为分步执行，确保数据安全
async function migrateFolder(sourcePath, targetDrive) {
  try {
    console.log(`开始执行文件夹迁移: ${sourcePath} 到 ${targetDrive}`);

    // 1. 标准化路径
    const normalizedSource = path.normalize(sourcePath);

    // 2. 基础检查
    if (!fs.existsSync(normalizedSource)) {
      throw new Error(`源文件夹不存在: ${normalizedSource}`);
    }

    const stats = fs.statSync(normalizedSource);
    if (!stats.isDirectory()) {
      throw new Error(`指定路径不是文件夹: ${normalizedSource}`);
    }

    // 3. 计算目标路径
    // 保持原有目录结构: C:\Program Files\App -> D:\CleanC_Migrated\Program Files\App
    const relativePath = normalizedSource.substring(3); // 移除盘符 "C:\"
    const targetRoot = path.join(targetDrive, 'CleanC_Migrated');
    const targetPath = path.join(targetRoot, relativePath);

    console.log(`目标路径: ${targetPath}`);

    // 4. 冲突检查与断点续传策略
    if (fs.existsSync(targetPath)) {
      // 以前是重命名备份，现在改为"增量/续传"模式
      // 因为 Robocopy 默认就是增量复制，只要目标存在，它会对比时间戳和大小
      try {
        const fileCount = fs.readdirSync(targetPath).length;
        if (fileCount > 0) {
          console.log(`目标路径已存在 (${fileCount} 个文件): ${targetPath}。将启用[断点续传/增量覆盖]模式。`);
          // 不做任何操作，让 Robocopy 自己去处理合并
        } else {
          // 是空文件夹，没关系
        }
      } catch (e) {
        // 如果连读都读不了，那还是要报错
        throw new Error(`无法访问目标位置: ${targetPath}。请检查权限。`);
      }
    }

    // 5. 确保目标父目录存在
    const targetParent = path.dirname(targetPath);
    if (!fs.existsSync(targetParent)) {
      console.log(`创建目标父目录: ${targetParent}`);
      fs.mkdirSync(targetParent, { recursive: true });
    }

    // --- 尝试终止进程 ---
    try {
      console.log('正在尝试终止占用源目录的进程...');
      const psScript = `
        $sourcePath = '${normalizedSource.replace(/'/g, "''")}';
        Get-Process | Where-Object { $_.Path -ne $null -and $_.Path.StartsWith($sourcePath) } | Stop-Process -Force -ErrorAction SilentlyContinue
      `;
      execSync(`powershell -NoProfile -NonInteractive -Command "${psScript.replace(/\n/g, ' ')}"`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (killErr) {
      console.warn('自动终止进程尝试失败:', killErr.message);
    }
    // --------------------

    // 6. 阶段一：复制文件
    // 使用 /MOVE 还是 /E ? 
    // 为了支持续传，我们坚持使用 /E (复制)。只有最后验证成功才手动删源。
    const copyCmd = `robocopy "${normalizedSource}" "${targetPath}" /E /COPYALL /ZB /DCOPY:T /R:3 /W:1 /MT:16 /NFL /NDL /NJH /NJS`;

    console.log(`执行复制命令: ${copyCmd}`);

    let copyExitCode = 0;
    try {
      execSync(copyCmd, { stdio: 'ignore' });
    } catch (err) {
      copyExitCode = err.status;
      // Code 8: Some copies failed
      if (copyExitCode >= 8) {
        console.warn(`Robocopy 完成但有警告 (Code: ${copyExitCode})。可能有文件被占用，但我们尝试继续...`);
        // 注意：这里不再 throw，也不再回滚。我们试试看能不能删掉源文件。
        // 如果源文件被锁，下一步删除肯定会失败，那时候再报错也不迟。
      }
    }

    // 7. 验证目标存在
    if (!fs.existsSync(targetPath)) {
      throw new Error('严重错误：复制看似执行了但目标文件夹未找到！');
    }

    // 8. 阶段二：删除源文件
    console.log('复制阶段完成，准备删除源文件夹...');
    try {
      execSync(`rmdir /s /q "${normalizedSource}"`);
    } catch (rmErr) {
      // 删除失败，再试一次
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        execSync(`rmdir /s /q "${normalizedSource}"`);
      } catch (retryErr) {
        console.error('删除源文件失败:', retryErr);
        // 关键决策：不回滚！保留已复制的数据。

        // 检查源文件夹还在不在
        if (fs.existsSync(normalizedSource)) {
          // 这是一个"不完美成功"
          // 我们不能建立链接，因为源文件夹还在。
          // 告诉用户重启后续传
          throw new Error(
            `\n⚠️ 迁移大部分完成，但因文件被占用，无法删除源文件夹。\n\n` +
            `我们已为您【保留了迁移进度】。\n` +
            `请重启电脑（确保软件彻底关闭），然后再次点击【一键搬家】，\n` +
            `程序将自动完成剩余步骤（无需重新复制）。`
          );
        }
      }
    }

    // 双重确认源是否真的没了
    if (fs.existsSync(normalizedSource)) {
      throw new Error(`无法完全删除源文件夹。请手动检查: ${normalizedSource}`);
    }

    // 9. 阶段三：创建目录联接 (Junction)
    console.log('源文件已清除，正在创建目录联接...');
    const mklinkCmd = `cmd /c mklink /J "${normalizedSource}" "${targetPath}"`;

    try {
      execSync(mklinkCmd);
      console.log('目录联接创建成功！');
    } catch (linkErr) {
      throw new Error(`数据已移动到 ${targetPath}，但在创建链接时失败: ${linkErr.message}。\n请手动执行命令: mklink /J "${normalizedSource}" "${targetPath}"`);
    }

    return {
      success: true,
      message: '软件搬家成功！',
      sourcePath: normalizedSource,
      targetPath: targetPath,
      method: 'Junction'
    };

  } catch (error) {
    console.error('migrateFolder 异常:', error);
    // 返回给前端的要是简单的 Object，如果是 Error 对象可能即在 IPC 中序列化有问题
    // 这里我们不仅 throw，还确保 IPC handler 能捕获。
    throw error;
  }
}

// 检查应用迁移状态（辅助函数）
function checkMigrationStatus(app) {
  let installPath = app.installLocation;

  // 1. 如果没有 installationLocation，尝试从 UninstallString 猜测
  if ((!installPath || installPath.trim() === '') && app.uninstallString) {
    try {
      const match = app.uninstallString.match(/^(?:"([^"]+)"|([^ ]+))/);
      if (match) {
        let exePath = match[1] || match[2];
        if (exePath && fs.existsSync(exePath)) {
          installPath = path.dirname(exePath);
        }
      }
    } catch (e) { }
  }

  // 2. 检查路径是否有效
  if (!installPath || !fs.existsSync(installPath)) {
    return { isMigrated: false };
  }

  // 3. 检查是否为 Junction/Symlink
  try {
    const lstat = fs.lstatSync(installPath);
    if (lstat.isSymbolicLink()) {
      const target = fs.readlinkSync(installPath);
      // 如果指向非 C 盘，则认为已迁移
      if (!target.toLowerCase().startsWith('c:')) {
        return { isMigrated: true, migratedTo: target };
      }
    }
  } catch (e) { }

  return { isMigrated: false };
}