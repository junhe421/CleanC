// 导入electron的ipcRenderer用于与主进程通信
const { ipcRenderer } = require('electron');

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 初始化导航菜单
  initNavigation();
  
  // 初始化仪表盘
  initDashboard();
  
  // 初始化快速清理功能
  initQuickClean();
  
  // 初始化大文件查找功能
  initLargeFiles();
  
  // 初始化重复文件查找功能
  initDuplicateFiles();
  
  // 初始化程序卸载功能
  initUninstall();
  
  // 初始化关于弹窗功能
  initAboutModal();
  
  // 添加图片错误处理
  addImageErrorHandlers();
});

// 初始化导航菜单
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const contentTabs = document.querySelectorAll('.content-tab');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // 移除所有导航项的active类
      navItems.forEach(i => i.classList.remove('active'));
      
      // 给当前点击的导航项添加active类
      item.classList.add('active');
      
      // 获取要显示的标签页ID
      const tabId = item.getAttribute('data-tab');
      
      // 隐藏所有内容标签页
      contentTabs.forEach(tab => tab.classList.remove('active'));
      
      // 显示对应的内容标签页
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// 初始化仪表盘
function initDashboard() {
  // 显示磁盘信息
  loadDiskInfo();
  
  // 绑定扫描系统按钮
  document.getElementById('scan-system-btn').addEventListener('click', () => {
    // 切换到快速清理标签页并触发扫描
    document.querySelector('.nav-item[data-tab="quick-clean"]').click();
    document.getElementById('start-quick-scan-btn').click();
  });
}

// 加载磁盘信息
async function loadDiskInfo() {
  try {
    const diskInfo = await ipcRenderer.invoke('get-disk-info');
    
    if (diskInfo && diskInfo.length > 0) {
      const cDrive = diskInfo[0];
      
      // 检查返回的磁盘信息是否包含所需属性
      if (cDrive && typeof cDrive.blocks === 'number' && 
          typeof cDrive.used === 'number' && 
          typeof cDrive.available === 'number' &&
          typeof cDrive.capacity === 'number') {
        
      const totalSpace = formatBytes(cDrive.blocks);
      const usedSpace = formatBytes(cDrive.used);
      const freeSpace = formatBytes(cDrive.available);
      const usedPercentage = Math.round(cDrive.capacity * 100);
      
      // 更新磁盘信息显示
      document.getElementById('total-space').textContent = totalSpace;
      document.getElementById('used-space').textContent = usedSpace;
      document.getElementById('free-space').textContent = freeSpace;
      
      // 创建饼图
      createDiskChart(usedPercentage, 100 - usedPercentage);
      } else {
        // 数据不完整，显示错误信息并尝试使用备用方法
        console.error('磁盘信息数据不完整:', cDrive);
        displayFallbackDiskInfo();
      }
    } else {
      // 未能获取到磁盘信息，使用备用方法
      console.error('未获取到C盘信息');
      displayFallbackDiskInfo();
    }
  } catch (error) {
    console.error('加载磁盘信息出错:', error);
    displayFallbackDiskInfo();
  }
}

// 使用备用方法获取并显示磁盘信息
async function displayFallbackDiskInfo() {
  try {
    // 尝试使用直接的系统命令获取磁盘信息
    const systemInfo = await ipcRenderer.invoke('get-system-disk-info');
    
    if (systemInfo && systemInfo.total && systemInfo.used && systemInfo.free) {
      // 更新磁盘信息显示
      document.getElementById('total-space').textContent = formatBytes(systemInfo.total);
      document.getElementById('used-space').textContent = formatBytes(systemInfo.used);
      document.getElementById('free-space').textContent = formatBytes(systemInfo.free);
      
      // 创建饼图
      const usedPercentage = Math.round((systemInfo.used / systemInfo.total) * 100);
      createDiskChart(usedPercentage, 100 - usedPercentage);
    } else {
      // 如果备用方法也失败，显示友好错误信息
      document.getElementById('total-space').textContent = '获取失败';
      document.getElementById('used-space').textContent = '获取失败';
      document.getElementById('free-space').textContent = '获取失败';
      
      // 创建占位饼图
      createDiskChart(50, 50); // 默认显示50/50的饼图
    }
  } catch (error) {
    console.error('备用方法获取磁盘信息失败:', error);
    document.getElementById('total-space').textContent = '获取失败';
    document.getElementById('used-space').textContent = '获取失败';
    document.getElementById('free-space').textContent = '获取失败';
    
    // 创建占位饼图
    createDiskChart(50, 50); // 默认显示50/50的饼图
  }
}

// 创建磁盘使用情况饼图
function createDiskChart(usedPercentage, freePercentage) {
  const ctx = document.getElementById('diskChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['已用空间', '可用空间'],
      datasets: [{
        data: [usedPercentage, freePercentage],
        backgroundColor: [
          '#1976D2',
          '#4CAF50'
        ],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '70%',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            font: {
              size: 14
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
}

// 初始化快速清理功能
function initQuickClean() {
  const startQuickScanBtn = document.getElementById('start-quick-scan-btn');
  const scanAgainBtn = document.getElementById('scan-again-btn');
  const cleanSelectedBtn = document.getElementById('clean-selected-btn');
  
  // 开始扫描按钮点击事件
  startQuickScanBtn.addEventListener('click', startQuickScan);
  
  // 重新扫描按钮点击事件
  scanAgainBtn.addEventListener('click', () => {
    document.getElementById('quick-clean-results').style.display = 'none';
    document.getElementById('scan-placeholder').style.display = 'block';
    startQuickScan();
  });
  
  // 清理所选项按钮点击事件
  cleanSelectedBtn.addEventListener('click', cleanSelectedItems);
}

// 开始快速扫描
async function startQuickScan() {
  // 显示扫描中状态
  document.getElementById('scan-placeholder').style.display = 'none';
  document.getElementById('scanning-status').style.display = 'flex';
  
  // 重置进度条
  const progressBar = document.getElementById('scan-progress');
  progressBar.style.width = '0%';
  
  // 模拟扫描进度
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 5;
    if (progress > 100) progress = 100;
    progressBar.style.width = `${progress}%`;
    
    if (progress >= 100) {
      clearInterval(progressInterval);
    }
  }, 200);
  
  try {
    // 获取临时文件列表
    const tempFiles = await ipcRenderer.invoke('scan-temp-files');
    
    // 扫描完成后显示结果
    setTimeout(() => {
      // 隐藏扫描中状态
      document.getElementById('scanning-status').style.display = 'none';
      // 显示扫描结果
      showScanResults(tempFiles);
    }, 3000); // 给一点时间让进度条走完
  } catch (error) {
    console.error('扫描出错:', error);
    document.getElementById('scanning-status').style.display = 'none';
    document.getElementById('scan-placeholder').style.display = 'block';
    alert('扫描过程中出现错误，请重试。');
  }
}

// 显示扫描结果
function showScanResults(items) {
  // 计算可清理空间总大小
  let totalSize = 0;
  let safeItemCount = 0;
  
  // 只统计安全可删除的项目
  items.forEach(item => {
    if (item.safeToDelete) {
      totalSize += item.size;
      safeItemCount++;
    }
  });
  
  // 更新结果摘要
  document.getElementById('total-junk-size').textContent = formatBytes(totalSize);
  document.getElementById('junk-file-count').textContent = `${items.length} 项`;
  
  // 清空列表
  const itemList = document.getElementById('cleanup-item-list');
  itemList.innerHTML = '';
  
  // 添加项目到列表
  items.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'cleanup-item';
    
    // 只有安全可删除的项目默认勾选
    const checked = item.safeToDelete ? 'checked' : '';
    const disabled = !item.safeToDelete ? 'disabled' : '';
    
    itemElement.innerHTML = `
      <input type="checkbox" ${checked} ${disabled} data-path="${item.path}">
      <div class="item-info">
        <div>${getPathDisplayName(item.path)}</div>
        <div class="item-path">${item.path}</div>
      </div>
      <div class="item-size">${formatBytes(item.size)}</div>
      <div class="item-safe ${item.safeToDelete ? 'safe-yes' : 'safe-no'}">
        ${item.safeToDelete ? '安全清理' : '不建议清理'}
      </div>
    `;
    
    itemList.appendChild(itemElement);
  });
  
  // 显示结果区域
  document.getElementById('quick-clean-results').style.display = 'block';
}

// 清理所选项目
async function cleanSelectedItems() {
  // 获取所有勾选的项目
  const checkedItems = document.querySelectorAll('#cleanup-item-list input[type="checkbox"]:checked');
  
  if (checkedItems.length === 0) {
    alert('请至少选择一项需要清理的内容');
    return;
  }
  
  // 确认清理
  if (!confirm('确定要清理所选项目吗？这将永久删除这些文件。')) {
    return;
  }
  
  // 显示扫描中状态（复用为清理中状态）
  document.getElementById('quick-clean-results').style.display = 'none';
  document.getElementById('scanning-status').style.display = 'flex';
  document.querySelector('#scanning-status h3').textContent = '正在清理...';
  document.querySelector('#scanning-status p').textContent = '请稍候，正在清理所选文件';
  
  // 重置进度条
  const progressBar = document.getElementById('scan-progress');
  progressBar.style.width = '0%';
  
  // 模拟清理进度
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress > 100) progress = 100;
    progressBar.style.width = `${progress}%`;
    
    if (progress >= 100) {
      clearInterval(progressInterval);
    }
  }, 100);
  
  try {
    // 准备需要清理的项目列表
    const itemsToClean = [];
    
    // 遍历所有已勾选的复选框
    checkedItems.forEach(checkbox => {
      itemsToClean.push({
        path: checkbox.getAttribute('data-path'),
        selected: true,
        safeToDelete: checkbox.disabled ? false : true
      });
    });
    
    // 调用主进程进行清理
    const results = await ipcRenderer.invoke('clean-temp-files', itemsToClean);
    
    // 等待一段时间，让进度条走完
    setTimeout(() => {
      document.getElementById('scanning-status').style.display = 'none';
      
      // 计算释放的空间
      let freedSpace = 0;
      const cleanItems = document.querySelectorAll('#cleanup-item-list input[type="checkbox"]:checked');
      cleanItems.forEach(item => {
        const sizeText = item.closest('.cleanup-item').querySelector('.item-size').textContent;
        freedSpace += parseBytes(sizeText);
      });
      
      // 显示清理完成弹窗
      showCleanupCompleteModal(results, formatBytes(freedSpace));
      
      // 重新加载磁盘信息
      loadDiskInfo();
    }, 2000);
  } catch (error) {
    console.error('清理出错:', error);
    document.getElementById('scanning-status').style.display = 'none';
    document.getElementById('quick-clean-results').style.display = 'block';
    alert('清理过程中出现错误，请重试。');
  }
}

// 显示清理完成弹窗
function showCleanupCompleteModal(results, freedSpace) {
  // 设置释放的空间
  document.getElementById('freed-space').textContent = freedSpace;
  
  // 清空摘要内容
  const summaryContainer = document.getElementById('cleanup-summary');
  summaryContainer.innerHTML = '';
  
  // 添加清理结果到摘要
  results.forEach(result => {
    const summaryItem = document.createElement('div');
    summaryItem.className = 'summary-item';
    
    summaryItem.innerHTML = `
      <div class="summary-item-path">${getPathDisplayName(result.path)}</div>
      <div class="summary-item-status ${result.success ? 'status-success' : 'status-error'}">
        ${result.success ? '成功' : '失败'}
      </div>
    `;
    
    summaryContainer.appendChild(summaryItem);
  });
  
  // 显示弹窗
  const modal = document.getElementById('cleanup-complete-modal');
  const modalContent = modal.querySelector('.modal-content');
  const modalHeader = modal.querySelector('.modal-header');
  
  // 重置弹窗位置
  modalContent.style.position = '';
  modalContent.style.top = '';
  modalContent.style.left = '';
  modalContent.style.margin = '';
  
  modal.style.display = 'flex';
  
  // 实现弹窗拖动功能
  let isDragging = false;
  let offsetX, offsetY;
  
  // 鼠标按下时开始拖动
  modalHeader.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - modalContent.getBoundingClientRect().left;
    offsetY = e.clientY - modalContent.getBoundingClientRect().top;
    modalContent.style.transition = 'none';
  });
  
  // 鼠标移动时拖动弹窗
  const mouseMoveHandler = (e) => {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // 确保不会拖出屏幕边界
    const maxX = window.innerWidth - modalContent.offsetWidth;
    const maxY = window.innerHeight - modalContent.offsetHeight;
    
    modalContent.style.left = `${Math.max(0, Math.min(maxX, x))}px`;
    modalContent.style.top = `${Math.max(0, Math.min(maxY, y))}px`;
    modalContent.style.position = 'fixed';
    modalContent.style.margin = '0';
  };
  
  // 鼠标释放时结束拖动
  const mouseUpHandler = () => {
    isDragging = false;
  };
  
  document.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseup', mouseUpHandler);
  
  // 绑定关闭按钮事件
  document.getElementById('modal-close-btn').addEventListener('click', () => {
    modal.style.display = 'none';
    
    // 移除事件监听器
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    
    // 重新显示扫描占位符
    document.getElementById('quick-clean-results').style.display = 'none';
    document.getElementById('scan-placeholder').style.display = 'block';
  });
  
  // 调整弹窗大小时自适应内容
  if (typeof ResizeObserver !== 'undefined') {
    let resizeObserver = new ResizeObserver(() => {
      const modalBody = modalContent.querySelector('.modal-body');
      if (modalBody) {
        modalBody.style.maxHeight = `${modalContent.clientHeight - 150}px`;
      }
    });
    
    resizeObserver.observe(modalContent);
  } else {
    // 兼容性处理，为不支持ResizeObserver的浏览器添加窗口大小变化监听
    window.addEventListener('resize', () => {
      const modalBody = modalContent.querySelector('.modal-body');
      if (modalBody && modalContent.offsetHeight > 0) {
        modalBody.style.maxHeight = `${modalContent.clientHeight - 150}px`;
      }
    });
  }
}

// 初始化大文件查找功能
function initLargeFiles() {
  document.getElementById('find-large-files-btn').addEventListener('click', async () => {
    const minSizeSelect = document.getElementById('min-file-size');
    const minSize = parseInt(minSizeSelect.value);
    
    // 显示占位符为"搜索中"
    const placeholder = document.getElementById('large-files-placeholder');
    placeholder.innerHTML = `
      <div class="spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
      <h3>正在查找大文件...</h3>
      <p>这可能需要几分钟时间，请耐心等待</p>
    `;
    placeholder.style.display = 'flex';
    document.getElementById('large-files-results').style.display = 'none';
    
    try {
      console.log(`开始查找大于 ${minSize}MB 的文件...`);
      // 调用主进程查找大文件
      const largeFiles = await ipcRenderer.invoke('get-large-files', minSize);
      console.log(`找到 ${largeFiles.length} 个大文件`);
      
      // 显示结果
      showLargeFilesResults(largeFiles);
    } catch (error) {
      console.error('查找大文件出错:', error);
      placeholder.innerHTML = `
        <div class="placeholder-icon">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <h3>查找出错</h3>
        <p>查找大文件时出现错误，请重试: ${error.message}</p>
      `;
    }
  });
}

// 显示大文件查找结果
function showLargeFilesResults(files) {
  if (files.length === 0) {
    // 没有找到文件
    const placeholder = document.getElementById('large-files-placeholder');
    placeholder.innerHTML = `
      <div class="placeholder-icon">
        <i class="fas fa-search"></i>
      </div>
      <h3>未找到大文件</h3>
      <p>没有找到符合条件的大文件，请尝试降低最小文件大小</p>
    `;
    placeholder.style.display = 'flex';
    document.getElementById('large-files-results').style.display = 'none';
    return;
  }
  
  // 获取结果区域
  const resultsContainer = document.getElementById('large-files-results');
  
  // 清空结果表格
  resultsContainer.innerHTML = '';
  
  // 添加工具栏
  const toolbarDiv = document.createElement('div');
  toolbarDiv.className = 'large-files-toolbar';
  toolbarDiv.innerHTML = `
    <div class="files-count">
      <span>找到 ${files.length} 个大文件</span>
    </div>
    <div class="toolbar-actions">
      <button class="secondary-btn" id="select-all-large-files-btn">
        <i class="fas fa-check-square"></i> 全选
      </button>
      <button class="secondary-btn" id="smart-recommend-btn">
        <i class="fas fa-magic"></i> 智能推荐
      </button>
      <button class="primary-btn" id="delete-large-files-btn">
        <i class="fas fa-trash-alt"></i> 删除所选文件
      </button>
    </div>
  `;
  resultsContainer.appendChild(toolbarDiv);
  
  // 创建文件列表容器
  const fileListContainer = document.createElement('div');
  fileListContainer.className = 'file-list-container';
  
  // 创建表格
  const table = document.createElement('table');
  table.className = 'file-list';
  
  // 添加表头
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th width="40px"><input type="checkbox" id="check-all-large-files"></th>
      <th>文件名</th>
      <th width="100px">大小</th>
      <th>位置</th>
      <th width="150px">推荐</th>
      <th width="80px">操作</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // 创建表格主体
  const tbody = document.createElement('tbody');
  tbody.id = 'large-files-tbody';
  
  // 分析每个文件并计算安全等级
  files = files.map(file => {
    // 确保file.path是字符串类型
    const filePath = String(file.path);
    
    // 从路径中提取文件名
    const fileName = filePath.split('\\').pop();
    
    // 获取文件所在目录
    const directory = filePath.substring(0, filePath.length - fileName.length - 1);
    
    // 获取文件扩展名
    const ext = fileName.split('.').pop().toLowerCase();
    
    // 判断文件安全等级 (1-安全可删除, 2-可能可删, 3-建议保留)
    let safetyLevel = 2; // 默认为"可能可删"
    let recommendation = '';
    
    // 基于文件类型的安全等级判断
    const safeExtensions = ['tmp', 'temp', 'bak', 'old', 'log', 'cache', 'dmp'];
    const mediumExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'mp4', 'mkv', 'avi', 'mov', 'wmv', 'iso'];
    const importantExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'psd', 'ai', 'exe'];
    
    if (safeExtensions.includes(ext)) {
      safetyLevel = 1;
      recommendation = '临时/备份文件，通常可以安全删除';
    } else if (importantExtensions.includes(ext)) {
      safetyLevel = 3;
      recommendation = '可能是重要文档，建议检查后再决定';
    } else if (mediumExtensions.includes(ext)) {
      safetyLevel = 2;
      recommendation = '请确认是否需要保留此文件';
    }
    
    // 基于目录的安全等级判断
    if (directory.includes('\\Temp\\') || directory.includes('\\Temporary') || directory.includes('\\Cache\\')) {
      safetyLevel = 1;
      recommendation = '临时文件目录，通常可以安全删除';
    } else if (directory.includes('\\Downloads\\')) {
      safetyLevel = 2;
      recommendation = '下载文件，请确认是否仍需要';
    } else if (directory.includes('\\Documents\\') || directory.includes('\\Work\\') || directory.includes('\\Projects\\')) {
      safetyLevel = 3;
      recommendation = '位于文档目录，可能包含重要信息';
    }
    
    // 基于文件名的关键词判断
    if (fileName.includes('backup') || fileName.includes('备份') || fileName.includes('temp') || fileName.includes('临时')) {
      safetyLevel = Math.min(safetyLevel, 2); // 降低安全等级（更安全删除）
      recommendation = '可能是备份或临时文件';
    }
    
    if (fileName.includes('important') || fileName.includes('重要') || fileName.includes('final') || fileName.includes('最终版')) {
      safetyLevel = 3; // 提高安全等级
      recommendation = '文件名表明这可能是重要文件';
    }
    
    // 检查文件最后修改时间
    const now = new Date();
    const fileDate = new Date(file.lastModified);
    const daysDiff = Math.floor((now - fileDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 180 && safetyLevel !== 3) { // 半年未修改且不是最高安全级别
      safetyLevel = Math.min(safetyLevel, 2);
      recommendation = '长时间未使用，可考虑删除';
    }
    
    if (daysDiff < 7 && safetyLevel !== 1) { // 最近一周修改过且不是最低安全级别
      safetyLevel = Math.max(safetyLevel, 2);
      recommendation = '最近修改过，可能正在使用';
    }
    
    return {
      ...file,
      fileName,
      directory,
      safetyLevel,
      recommendation
    };
  });
  
  // 添加文件到表格
  files.forEach((file, index) => {
    const row = document.createElement('tr');
    row.setAttribute('data-index', index);
    
    // 确保path是完整的有效路径
    let filePath = String(file.path);
    console.log(`文件 #${index} 原始路径: ${filePath}`);
    
    // 添加冒号（如果需要）
    if (/^[a-zA-Z]/.test(filePath) && !filePath.includes(':')) {
      filePath = filePath[0] + ':' + filePath.substring(1);
      console.log(`文件 #${index} 添加冒号后: ${filePath}`);
    }
    
    // 添加路径分隔符（如果需要）
    if (/^[a-zA-Z]:/.test(filePath) && filePath.charAt(2) !== '\\' && filePath.charAt(2) !== '/') {
      filePath = filePath.substring(0, 2) + '\\' + filePath.substring(2);
      console.log(`文件 #${index} 添加路径分隔符后: ${filePath}`);
    }
    
    // 替换所有正斜杠为反斜杠（Windows路径标准）
    filePath = filePath.replace(/\//g, '\\');
    console.log(`文件 #${index} 最终路径: ${filePath}`);
    
    // 对路径进行HTML转义，防止XSS攻击和路径中的特殊字符问题
    const escapedPath = filePath.replace(/"/g, '&quot;');
    
    // 根据安全等级设置颜色和图标
    let safetyColor, safetyIcon, safetyText;
    
    if (file.safetyLevel === 1) {
      safetyColor = '#4CAF50'; // 绿色 - 安全可删
      safetyIcon = 'fa-check-circle';
      safetyText = '安全可删';
    } else if (file.safetyLevel === 2) {
      safetyColor = '#FF9800'; // 橙色 - 可能可删
      safetyIcon = 'fa-exclamation-circle';
      safetyText = '确认后可删';
    } else {
      safetyColor = '#F44336'; // 红色 - 建议保留
      safetyIcon = 'fa-times-circle';
      safetyText = '建议保留';
    }
    
    row.innerHTML = `
      <td><input type="checkbox" class="file-checkbox" data-path="${escapedPath}"></td>
      <td title="${file.fileName}">${file.fileName}</td>
      <td>${formatBytes(file.size)}</td>
      <td title="${file.directory}">${file.directory}</td>
      <td>
        <span style="color: ${safetyColor}; font-weight: bold;">
          <i class="fas ${safetyIcon}"></i> ${safetyText}
        </span>
        <div style="font-size: 11px; color: #666; margin-top: 3px;">${file.recommendation}</div>
      </td>
      <td>
        <span class="file-action" title="打开文件位置" data-path="${escapedPath}">
          <i class="fas fa-folder-open"></i>
        </span>
        <span class="file-action" title="删除文件" data-path="${escapedPath}">
          <i class="fas fa-trash"></i>
        </span>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  fileListContainer.appendChild(table);
  resultsContainer.appendChild(fileListContainer);
  
  // 显示结果
  document.getElementById('large-files-placeholder').style.display = 'none';
  resultsContainer.style.display = 'block';
  
  // 移除之前的事件监听器（如果存在）
  const oldListener = resultsContainer._clickListener;
  if (oldListener) {
    resultsContainer.removeEventListener('click', oldListener);
  }
  
  // 为操作按钮添加事件监听器（使用事件委托）
  const clickListener = function(e) {
    // 查找被点击的操作按钮
    let target = e.target;
    
    // 如果点击的是图标，找到其父元素（操作按钮）
    if (target.tagName.toLowerCase() === 'i' && target.parentElement.classList.contains('file-action')) {
      target = target.parentElement;
    }
    
    // 如果找到了操作按钮
    if (target.classList.contains('file-action')) {
      const filePath = target.getAttribute('data-path');
      
      if (target.title === "打开文件位置" || target.querySelector('i.fa-folder-open')) {
        console.log("点击了打开文件位置按钮，路径:", filePath);
        openFileLocation(filePath);
      } else if (target.title === "删除文件" || target.querySelector('i.fa-trash')) {
        console.log("点击了删除文件按钮，路径:", filePath);
        deleteSingleFile(filePath);
      }
    }
  };
  
  // 保存事件监听器引用以便以后可以移除
  resultsContainer._clickListener = clickListener;
  resultsContainer.addEventListener('click', clickListener);
  
  // 绑定全选/取消全选功能
  const checkAllBox = document.getElementById('check-all-large-files');
  checkAllBox.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('#large-files-tbody .file-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = this.checked;
    });
  });
  
  // 绑定"全选"按钮
  document.getElementById('select-all-large-files-btn').addEventListener('click', function() {
    const checkboxes = document.querySelectorAll('#large-files-tbody .file-checkbox');
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = !allChecked;
    });
    
    // 更新全选复选框
    checkAllBox.checked = !allChecked;
  });
  
  // 绑定"智能推荐"按钮
  document.getElementById('smart-recommend-btn').addEventListener('click', function() {
    // 先取消所有选择
    document.querySelectorAll('#large-files-tbody .file-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // 智能选择安全可删除的文件 (safetyLevel = 1)
    files.forEach((file, index) => {
      if (file.safetyLevel === 1) {
        const row = document.querySelector(`#large-files-tbody tr[data-index="${index}"]`);
        if (row) {
          const checkbox = row.querySelector('.file-checkbox');
          if (checkbox) {
            checkbox.checked = true;
          }
        }
      }
    });
    
    // 更新表格视觉效果，突出显示被选中的行
    document.querySelectorAll('#large-files-tbody tr').forEach(row => {
      const checkbox = row.querySelector('.file-checkbox');
      if (checkbox && checkbox.checked) {
        row.style.backgroundColor = '#e8f5e9'; // 浅绿色背景
      } else {
        row.style.backgroundColor = '';
      }
    });
    
    // 提示用户
    const safeFilesCount = files.filter(file => file.safetyLevel === 1).length;
    alert(`智能推荐已完成！\n\n系统已自动勾选 ${safeFilesCount} 个被评估为"安全可删除"的文件。\n\n这些文件通常是临时文件、缓存文件或备份文件，删除它们一般不会影响系统运行。\n\n请检查推荐结果并确认删除操作。`);
  });
  
  // 绑定"删除所选文件"按钮
  document.getElementById('delete-large-files-btn').addEventListener('click', async function() {
    const checkedBoxes = document.querySelectorAll('#large-files-tbody .file-checkbox:checked');
    
    if (checkedBoxes.length === 0) {
      alert('请选择要删除的文件');
      return;
    }
    
    // 计算安全等级为3的被选文件数量
    const importantFilesSelected = [];
    checkedBoxes.forEach(checkbox => {
      const row = checkbox.closest('tr');
      const index = parseInt(row.getAttribute('data-index'));
      if (files[index] && files[index].safetyLevel === 3) {
        importantFilesSelected.push(files[index].fileName);
      }
    });
    
    // 如果选中了重要文件，显示额外警告
    let confirmMessage = `确定要删除所选的 ${checkedBoxes.length} 个文件吗？此操作不可恢复！`;
    
    if (importantFilesSelected.length > 0) {
      confirmMessage += `\n\n警告：您选择了 ${importantFilesSelected.length} 个被标记为"建议保留"的重要文件：\n` + 
        importantFilesSelected.slice(0, 3).join('\n') + 
        (importantFilesSelected.length > 3 ? `\n...以及 ${importantFilesSelected.length - 3} 个其他文件` : '');
    }
    
    // 确认删除
    if (!confirm(confirmMessage)) {
      return;
    }
    
    // 收集要删除的文件路径
    const filesToDelete = [];
    checkedBoxes.forEach(checkbox => {
      // 获取HTML转义后的路径属性值并还原
      const escapedPath = checkbox.getAttribute('data-path');
      const filePath = escapedPath.replace(/&quot;/g, '"');
      filesToDelete.push(filePath);
    });
    
    console.log(`准备删除 ${filesToDelete.length} 个文件...`);
    
    // 更新UI为"删除中"
    resultsContainer.style.display = 'none';
    
    const placeholder = document.getElementById('large-files-placeholder');
    placeholder.innerHTML = `
      <div class="spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
      <h3>正在删除文件...</h3>
      <p>请稍候，正在处理 ${filesToDelete.length} 个文件</p>
    `;
    placeholder.style.display = 'flex';
    
    try {
      // 调用主进程删除文件
      const results = await ipcRenderer.invoke('delete-large-files', filesToDelete);
      
      // 计算成功删除的文件数
      const successCount = results.filter(result => result.success).length;
      const failedCount = results.length - successCount;
      
      console.log(`删除完成，成功: ${successCount}，失败: ${failedCount}`);
      
      // 显示结果
      placeholder.innerHTML = `
        <div class="placeholder-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>删除完成</h3>
        <p>成功: ${successCount} 个文件, 失败: ${failedCount} 个文件</p>
        <button class="primary-btn" id="refresh-large-files-btn">
          <i class="fas fa-sync"></i> 刷新列表
        </button>
      `;
      
      // 绑定刷新按钮事件
      document.getElementById('refresh-large-files-btn').addEventListener('click', () => {
        // 重新触发搜索按钮点击事件
        document.getElementById('find-large-files-btn').click();
      });
    } catch (error) {
      console.error('删除文件出错:', error);
      placeholder.innerHTML = `
        <div class="placeholder-icon">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <h3>删除出错</h3>
        <p>删除文件时出现错误: ${error.message}</p>
        <button class="primary-btn" id="back-to-large-files-btn">
          <i class="fas fa-arrow-left"></i> 返回结果
        </button>
      `;
      
      // 绑定返回按钮事件
      document.getElementById('back-to-large-files-btn').addEventListener('click', () => {
        placeholder.style.display = 'none';
        resultsContainer.style.display = 'block';
      });
    }
  });
}

// 全局函数，打开文件位置
function openFileLocation(filePath) {
  try {
    console.log(`-----调试信息：打开文件位置-----`);
    console.log(`原始传入的filePath: ${filePath}`);
    
    // 对HTML转义的路径进行还原
    let path = filePath.replace(/&quot;/g, '"');
    console.log(`HTML转义还原后: ${path}`);
    
    // 解决路径损坏问题 - 检查是否是典型的损坏模式
    if (path.includes('UsersAA') && !path.includes('Users\\AA')) {
      // 尝试修复路径 - 添加丢失的分隔符
      path = path.replace(/UsersAA/g, 'Users\\AA\\');
      path = path.replace(/AppDataLocal/g, 'AppData\\Local\\');
      path = path.replace(/AppDataRoaming/g, 'AppData\\Roaming\\');
      path = path.replace(/AppDataLocalLow/g, 'AppData\\LocalLow\\');
      console.log(`路径分隔符修复后: ${path}`);
    }
    
    // 检查路径格式，确保路径中包含冒号和目录分隔符
    let normalizedPath = path;
    
    // 确保驱动器字母后有冒号（如 C:）
    if (/^[a-zA-Z]/.test(normalizedPath) && !normalizedPath.includes(':')) {
      normalizedPath = normalizedPath[0] + ':' + normalizedPath.substring(1);
      console.log(`添加冒号后: ${normalizedPath}`);
    }
    
    // 确保路径分隔符正确 - 使用双重替换确保安全
    normalizedPath = normalizedPath.replace(/\//g, '\\');
    normalizedPath = normalizedPath.replace(/\\\\/g, '\\');
    console.log(`修正分隔符后: ${normalizedPath}`);
    
    // 确保驱动器字母和路径之间有分隔符（如 C:\）
    if (/^[a-zA-Z]:/.test(normalizedPath) && normalizedPath.charAt(2) !== '\\') {
      normalizedPath = normalizedPath.substring(0, 2) + '\\' + normalizedPath.substring(2);
      console.log(`添加路径分隔符后: ${normalizedPath}`);
    }
    
    // 尝试解析完整路径
    let directory = '';
    let fileName = '';
    
    try {
      directory = normalizedPath.substring(0, normalizedPath.lastIndexOf('\\'));
      fileName = normalizedPath.substring(normalizedPath.lastIndexOf('\\') + 1);
    } catch (e) {
      console.error('解析目录和文件名时出错:', e);
    }
    
    console.log(`解析出的目录: ${directory}`);
    console.log(`解析出的文件名: ${fileName}`);
    
    console.log(`最终处理后的路径: ${normalizedPath}`);
    
    // 通过IPC调用主进程打开文件位置
    ipcRenderer.invoke('open-file-location', normalizedPath)
      .then(result => {
        console.log(`主进程返回结果:`, result);
        if (!result.success) {
          console.error('打开文件位置失败:', result.error);
          
          // 如果打开失败，尝试打开父目录
          if (directory) {
            console.log(`尝试直接打开目录: ${directory}`);
            return ipcRenderer.invoke('open-directory', directory);
          } else {
          alert(`无法打开文件位置: ${result.error}`);
            return Promise.reject(result.error);
          }
        } else {
          console.log('文件位置已打开');
          return result;
        }
      })
      .then(result => {
        if (result && !result.success) {
          alert(`无法打开文件位置: ${result.error || '未知错误'}`);
        }
      })
      .catch(error => {
        console.error('打开文件位置出错:', error);
        alert(`打开文件位置时出错: ${error.message || '未知错误'}`);
      });
  } catch (error) {
    console.error('调用打开文件位置函数出错:', error);
    alert(`调用打开文件位置函数出错: ${error.message || '未知错误'}`);
  }
}

// 全局函数，删除单个文件
function deleteSingleFile(filePath) {
  try {
    console.log(`-----调试信息：删除单个文件-----`);
    console.log(`原始传入的filePath: ${filePath}`);
    
    // 对HTML转义的路径进行还原
    let path = filePath.replace(/&quot;/g, '"');
    console.log(`HTML转义还原后: ${path}`);
    
    // 解决路径损坏问题 - 检查是否是典型的损坏模式
    if (path.includes('UsersAA') && !path.includes('Users\\AA')) {
      // 尝试修复路径 - 添加丢失的分隔符
      path = path.replace(/UsersAA/g, 'Users\\AA\\');
      path = path.replace(/AppDataLocal/g, 'AppData\\Local\\');
      path = path.replace(/AppDataRoaming/g, 'AppData\\Roaming\\');
      path = path.replace(/AppDataLocalLow/g, 'AppData\\LocalLow\\');
      console.log(`路径分隔符修复后: ${path}`);
    }
    
    // 检查路径格式，确保路径中包含冒号和目录分隔符
    let normalizedPath = path;
    
    // 确保驱动器字母后有冒号（如 C:）
    if (/^[a-zA-Z]/.test(normalizedPath) && !normalizedPath.includes(':')) {
      normalizedPath = normalizedPath[0] + ':' + normalizedPath.substring(1);
      console.log(`添加冒号后: ${normalizedPath}`);
    }
    
    // 确保路径分隔符正确 - 使用双重替换确保安全
    normalizedPath = normalizedPath.replace(/\//g, '\\');
    normalizedPath = normalizedPath.replace(/\\\\/g, '\\');
    console.log(`修正分隔符后: ${normalizedPath}`);
    
    // 确保驱动器字母和路径之间有分隔符（如 C:\）
    if (/^[a-zA-Z]:/.test(normalizedPath) && normalizedPath.charAt(2) !== '\\') {
      normalizedPath = normalizedPath.substring(0, 2) + '\\' + normalizedPath.substring(2);
      console.log(`添加路径分隔符后: ${normalizedPath}`);
    }
    
    console.log(`最终处理后的路径: ${normalizedPath}`);
    
    // 确认删除
    if (!confirm(`确定要删除此文件吗？\n${normalizedPath}\n\n此操作不可恢复！`)) {
      return;
    }
    
    // 通过IPC调用主进程删除文件
    ipcRenderer.invoke('delete-large-files', [normalizedPath])
      .then(results => {
        if (results.length > 0 && results[0].success) {
          console.log('文件删除成功');
          alert('文件已成功删除！');
          
          // 刷新列表
          document.getElementById('find-large-files-btn').click();
        } else {
          const errorMsg = results[0]?.error || '未知错误';
          console.error('删除文件失败:', errorMsg);
          alert(`删除文件失败: ${errorMsg}`);
        }
      })
      .catch(error => {
        console.error('删除文件出错:', error);
        alert(`删除文件时出错: ${error.message || '未知错误'}`);
      });
  } catch (error) {
    console.error('调用删除文件函数出错:', error);
    alert(`调用删除文件函数出错: ${error.message || '未知错误'}`);
  }
}

// 初始化重复文件查找功能
function initDuplicateFiles() {
  // 处理路径选择改变事件
  const pathSelect = document.getElementById('search-path');
  const customPath = document.getElementById('custom-path');
  
  pathSelect.addEventListener('change', () => {
    if (pathSelect.value === 'custom') {
      customPath.style.display = 'block';
    } else {
      customPath.style.display = 'none';
    }
  });
  
  // 查找重复文件按钮点击事件
  document.getElementById('find-duplicates-btn').addEventListener('click', async () => {
    // 获取选择的路径
    const pathSelectValue = pathSelect.value;
    let searchPath = pathSelectValue;
    
    // 如果是自定义路径，获取输入值
    if (pathSelectValue === 'custom') {
      const customPathValue = customPath.value.trim();
      if (!customPathValue) {
        alert('请输入自定义路径');
        return;
      }
      searchPath = 'custom:' + customPathValue;
    }
    
    // 更新占位符为"搜索中"
    const placeholder = document.getElementById('duplicate-placeholder');
    placeholder.innerHTML = `
      <div class="spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
      <h3>正在查找重复文件...</h3>
      <p>这可能需要几分钟时间，请耐心等待</p>
    `;
    placeholder.style.display = 'flex';
    document.getElementById('duplicate-results').style.display = 'none';
    
    try {
      // 调用主进程查找重复文件
      const result = await ipcRenderer.invoke('find-duplicate-files', searchPath);
      
      if (result.error) {
        // 显示错误信息
        placeholder.innerHTML = `
          <div class="placeholder-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h3>查找出错</h3>
          <p>${result.error}</p>
        `;
        placeholder.style.display = 'flex';
        return;
      }
      
      // 显示结果
      showDuplicateFilesResults(result);
    } catch (error) {
      console.error('查找重复文件出错:', error);
      placeholder.innerHTML = `
        <div class="placeholder-icon">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <h3>查找出错</h3>
        <p>查找重复文件时出现错误，请重试</p>
      `;
    }
  });
}

// 显示重复文件查找结果
function showDuplicateFilesResults(result) {
  const { duplicateGroups, totalFiles, totalDuplicates, searchPath } = result;
  
  // 获取结果显示区域
  const resultsContainer = document.getElementById('duplicate-results');
  
  if (duplicateGroups.length === 0) {
    // 没有找到重复文件
    const placeholder = document.getElementById('duplicate-placeholder');
    placeholder.innerHTML = `
      <div class="placeholder-icon">
        <i class="fas fa-search"></i>
      </div>
      <h3>未找到重复文件</h3>
      <p>在选择的目录中没有找到内容相同的文件</p>
    `;
    placeholder.style.display = 'flex';
    resultsContainer.style.display = 'none';
    return;
  }
  
  // 清空结果区域
  resultsContainer.innerHTML = '';
  
  // 添加结果摘要
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'duplicate-summary';
  summaryDiv.innerHTML = `
    <div class="summary-card">
      <i class="fas fa-copy"></i>
      <h3>重复文件组</h3>
      <p>${duplicateGroups.length} 组</p>
    </div>
    <div class="summary-card">
      <i class="fas fa-file-alt"></i>
      <h3>重复文件数量</h3>
      <p>${totalDuplicates} 个文件</p>
    </div>
    <div class="summary-card">
      <i class="fas fa-search"></i>
      <h3>已扫描文件</h3>
      <p>${totalFiles} 个文件</p>
    </div>
  `;
  resultsContainer.appendChild(summaryDiv);
  
  // 添加操作按钮
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'duplicate-actions';
  actionsDiv.innerHTML = `
    <button class="secondary-btn" id="select-all-btn">
      <i class="fas fa-check-square"></i> 全选
    </button>
    <button class="secondary-btn" id="select-newer-btn">
      <i class="fas fa-calendar-check"></i> 保留新文件
    </button>
    <button class="secondary-btn" id="select-older-btn">
      <i class="fas fa-calendar-minus"></i> 保留旧文件
    </button>
    <button class="secondary-btn" id="smart-select-btn">
      <i class="fas fa-magic"></i> 智能选择
    </button>
    <button class="primary-btn" id="delete-selected-duplicates-btn">
      <i class="fas fa-trash-alt"></i> 删除所选文件
    </button>
  `;
  resultsContainer.appendChild(actionsDiv);
  
  // 添加重复文件组列表
  const groupsContainer = document.createElement('div');
  groupsContainer.className = 'duplicate-groups';
  
  duplicateGroups.forEach((group, groupIndex) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'duplicate-group';
    
    // 提取代表性文件信息
    const sampleFile = group.files[0];
    const fileName = sampleFile.path.split('\\').pop();
    const fileExt = fileName.split('.').pop().toUpperCase();
    
    // 创建组标题
    const groupHeader = document.createElement('div');
    groupHeader.className = 'group-header';
    groupHeader.innerHTML = `
      <div class="group-icon">
        <span class="file-ext">${fileExt}</span>
      </div>
      <div class="group-info">
        <div class="group-title">组 #${groupIndex + 1}: ${fileName}</div>
        <div class="group-details">
          <span>${group.files.length} 个相同文件</span>
          <span>文件大小: ${formatBytes(sampleFile.size)}</span>
        </div>
      </div>
      <div class="group-toggle" data-group="${groupIndex}">
        <i class="fas fa-chevron-down"></i>
      </div>
    `;
    groupDiv.appendChild(groupHeader);
    
    // 创建文件列表
    const fileList = document.createElement('div');
    fileList.className = 'duplicate-file-list';
    fileList.id = `file-group-${groupIndex}`;
    
    group.files.forEach((file, fileIndex) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'duplicate-file';
      fileItem.id = `file-${groupIndex}-${fileIndex}`;
      
      // 从路径中提取文件名和目录
      const fileName = file.path.split('\\').pop();
      const directory = file.path.substring(0, file.path.length - fileName.length - 1);
      const date = new Date(file.lastModified).toLocaleString();
      
      // 规范化路径，确保格式正确
      let normalizedPath = file.path;
      // 替换所有正斜杠为反斜杠（Windows路径标准）
      normalizedPath = normalizedPath.replace(/\//g, '\\');
      // 对路径进行HTML转义，防止XSS攻击和特殊字符问题
      const escapedPath = normalizedPath.replace(/"/g, '&quot;');
      
      fileItem.innerHTML = `
        <div class="file-checkbox">
          <input type="checkbox" data-group="${groupIndex}" data-file="${fileIndex}">
        </div>
        <div class="file-info">
          <div class="file-name">${fileName}</div>
          <div class="file-details">
            <span class="file-path" title="${directory}">${directory}</span>
            <span class="file-date">${date}</span>
          </div>
        </div>
        <div class="file-size">${formatBytes(file.size)}</div>
        <div class="file-actions">
          <span class="file-action" title="打开文件位置" data-path="${escapedPath}">
            <i class="fas fa-folder-open"></i>
          </span>
          <span class="recommended-badge" style="display: none; color: #4caf50; font-weight: bold; margin-left: 5px;">
            <i class="fas fa-check-circle"></i> 推荐保留
          </span>
        </div>
      `;
      
      fileList.appendChild(fileItem);
    });
    
    groupDiv.appendChild(fileList);
    groupsContainer.appendChild(groupDiv);
  });
  
  resultsContainer.appendChild(groupsContainer);
  
  // 显示结果区域
  document.getElementById('duplicate-placeholder').style.display = 'none';
  resultsContainer.style.display = 'block';
  
  // 移除之前的文件操作事件监听器（如果存在）
  const oldListener = resultsContainer._clickListener;
  if (oldListener) {
    resultsContainer.removeEventListener('click', oldListener);
  }
  
  // 为操作按钮添加事件监听器（使用事件委托）
  const clickListener = function(e) {
    // 查找被点击的操作按钮
    let target = e.target;
    
    // 如果点击的是图标，找到其父元素（操作按钮）
    if (target.tagName.toLowerCase() === 'i' && target.parentElement.classList.contains('file-action')) {
      target = target.parentElement;
    }
    
    // 如果找到了操作按钮
    if (target.classList.contains('file-action')) {
      const filePath = target.getAttribute('data-path');
      
      if (target.title === "打开文件位置" || target.querySelector('i.fa-folder-open')) {
        console.log("重复文件功能：点击了打开文件位置按钮，路径:", filePath);
        openFileLocation(filePath);
      }
    }
  };
  
  // 保存事件监听器引用以便以后可以移除
  resultsContainer._clickListener = clickListener;
  resultsContainer.addEventListener('click', clickListener);
  
  // 绑定组展开/折叠功能
  document.querySelectorAll('.group-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      const groupIndex = this.getAttribute('data-group');
      const fileList = document.getElementById(`file-group-${groupIndex}`);
      
      if (fileList.style.display === 'none') {
        fileList.style.display = 'block';
        this.innerHTML = '<i class="fas fa-chevron-up"></i>';
      } else {
        fileList.style.display = 'none';
        this.innerHTML = '<i class="fas fa-chevron-down"></i>';
      }
    });
  });
  
  // 绑定操作按钮事件
  document.getElementById('select-all-btn').addEventListener('click', () => {
    const allCheckboxes = document.querySelectorAll('.duplicate-file input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
  });
  
  document.getElementById('select-newer-btn').addEventListener('click', () => {
    // 确保当前所有的勾选框都是未选中状态
    document.querySelectorAll('.duplicate-file input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // 按组处理，每组中保留最新的文件，选中其他文件
    duplicateGroups.forEach((group, groupIndex) => {
      // 找出最新文件的索引
      let newestFileIndex = 0;
      let newestDate = new Date(group.files[0].lastModified);
      
      for (let i = 1; i < group.files.length; i++) {
        const currentDate = new Date(group.files[i].lastModified);
        if (currentDate > newestDate) {
          newestDate = currentDate;
          newestFileIndex = i;
        }
      }
      
      // 选中除了最新文件以外的所有文件
      group.files.forEach((file, fileIndex) => {
        if (fileIndex !== newestFileIndex) {
          const checkbox = document.querySelector(`.duplicate-file input[data-group="${groupIndex}"][data-file="${fileIndex}"]`);
          if (checkbox) checkbox.checked = true;
        }
      });
    });
  });
  
  document.getElementById('select-older-btn').addEventListener('click', () => {
    // 确保当前所有的勾选框都是未选中状态
    document.querySelectorAll('.duplicate-file input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // 按组处理，每组中保留最旧的文件，选中其他文件
    duplicateGroups.forEach((group, groupIndex) => {
      // 找出最旧文件的索引
      let oldestFileIndex = 0;
      let oldestDate = new Date(group.files[0].lastModified);
      
      for (let i = 1; i < group.files.length; i++) {
        const currentDate = new Date(group.files[i].lastModified);
        if (currentDate < oldestDate) {
          oldestDate = currentDate;
          oldestFileIndex = i;
        }
      }
      
      // 选中除了最旧文件以外的所有文件
      group.files.forEach((file, fileIndex) => {
        if (fileIndex !== oldestFileIndex) {
          const checkbox = document.querySelector(`.duplicate-file input[data-group="${groupIndex}"][data-file="${fileIndex}"]`);
          if (checkbox) checkbox.checked = true;
        }
      });
    });
  });
  
  // 绑定智能选择按钮事件
  document.getElementById('smart-select-btn').addEventListener('click', () => {
    // 先清除所有选择
    document.querySelectorAll('.duplicate-file input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // 隐藏所有推荐标记
    document.querySelectorAll('.recommended-badge').forEach(badge => {
      badge.style.display = 'none';
    });
    
    // 按组处理，使用智能规则选择要保留的文件
    duplicateGroups.forEach((group, groupIndex) => {
      // 评分系统 - 每个文件获取一个得分，得分最高的保留
      const fileScores = group.files.map((file, index) => {
        let score = 0;
        const fileName = file.path.split('\\').pop();
        const directory = file.path.substring(0, file.path.length - fileName.length - 1);
        const dateModified = new Date(file.lastModified);
        
        // 1. 位置评分：某些路径的文件更重要
        // 考虑文档文件夹中的文件比临时文件夹重要
        if (directory.includes('\\Documents\\') || directory.includes('文档')) {
          score += 20;
        }
        if (directory.includes('\\Desktop\\') || directory.includes('桌面')) {
          score += 15;
        }
        if (directory.includes('\\Downloads\\') || directory.includes('下载')) {
          score -= 5;  // 下载文件夹可能是临时下载的
        }
        if (directory.includes('\\Temp\\') || directory.includes('临时') || directory.includes('缓存') || directory.includes('Cache')) {
          score -= 30;  // 临时文件夹通常可以删除
        }
        
        // 2. 文件名评分：有些文件名表明它们是更重要的版本
        if (fileName.includes('最终版') || fileName.includes('final') || fileName.includes('完成')) {
          score += 25;
        }
        if (fileName.includes('备份') || fileName.includes('backup') || fileName.includes('副本') || fileName.includes('copy')) {
          score -= 15;
        }
        if (fileName.includes('旧') || fileName.includes('old')) {
          score -= 20;
        }
        
        // 3. 日期评分：较新的文件通常更重要，但不是绝对的
        // 获取当前日期和文件修改日期的差值（天数）
        const daysSinceModified = (new Date() - dateModified) / (1000 * 60 * 60 * 24);
        
        // 较新的文件得分更高，但增长率会随时间递减
        score += Math.max(0, 15 - Math.log10(daysSinceModified + 1) * 5);
        
        return { index, score, path: file.path };
      });
      
      // 按得分降序排序
      fileScores.sort((a, b) => b.score - a.score);
      
      // 得分最高的文件将被保留
      const keepFileIndex = fileScores[0].index;
      
      // 显示推荐保留标记
      const recommendedFile = document.getElementById(`file-${groupIndex}-${keepFileIndex}`);
      if (recommendedFile) {
        const badge = recommendedFile.querySelector('.recommended-badge');
        if (badge) {
          badge.style.display = 'inline-block';
        }
      }
      
      // 选择除了得分最高的文件以外的所有文件
      group.files.forEach((file, fileIndex) => {
        if (fileIndex !== keepFileIndex) {
          const checkbox = document.querySelector(`.duplicate-file input[data-group="${groupIndex}"][data-file="${fileIndex}"]`);
          if (checkbox) checkbox.checked = true;
        }
      });
      
      // 在控制台输出有关智能选择的详细信息（方便调试）
      console.log(`组 #${groupIndex + 1} 智能选择结果:`, {
        保留文件: group.files[keepFileIndex].path,
        得分详情: fileScores
      });
    });
    
    // 显示提示信息
    alert('智能选择已完成！绿色标记的文件将被保留，已自动勾选其他重复文件。\n\n请注意检查自动选择的结果，确保不会误删重要文件。');
  });
  
  document.getElementById('delete-selected-duplicates-btn').addEventListener('click', async () => {
    // 获取所有勾选的文件
    const checkedFiles = document.querySelectorAll('.duplicate-file input[type="checkbox"]:checked');
    
    if (checkedFiles.length === 0) {
      alert('请选择要删除的文件');
      return;
    }
    
    // 确认删除
    if (!confirm(`确定要删除所选的 ${checkedFiles.length} 个文件吗？此操作不可恢复！`)) {
      return;
    }
    
    // 构建要删除的文件列表
    const filesToDelete = [];
    const duplicateGroupsCopy = JSON.parse(JSON.stringify(result.duplicateGroups));
    
    checkedFiles.forEach(checkbox => {
      const groupIndex = parseInt(checkbox.getAttribute('data-group'));
      const fileIndex = parseInt(checkbox.getAttribute('data-file'));
      
      if (duplicateGroupsCopy[groupIndex] && duplicateGroupsCopy[groupIndex].files[fileIndex]) {
        filesToDelete.push(duplicateGroupsCopy[groupIndex].files[fileIndex]);
      }
    });
    
    // 更新UI为"删除中"
    const resultsContainer = document.getElementById('duplicate-results');
    resultsContainer.style.display = 'none';
    
    const placeholder = document.getElementById('duplicate-placeholder');
    placeholder.innerHTML = `
      <div class="spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
      </div>
      <h3>正在删除所选文件...</h3>
      <p>请稍候，正在处理 ${filesToDelete.length} 个文件</p>
    `;
    placeholder.style.display = 'flex';
    
    try {
      // 调用主进程删除文件
      const deleteResults = await ipcRenderer.invoke('delete-duplicate-files', filesToDelete);
      
      // 计算成功删除的文件数
      const successCount = deleteResults.filter(result => result.success).length;
      const failedCount = deleteResults.length - successCount;
      
      // 显示结果
      placeholder.innerHTML = `
        <div class="placeholder-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3>删除完成</h3>
        <p>成功: ${successCount} 个文件, 失败: ${failedCount} 个文件</p>
        <button class="primary-btn" id="back-to-search-btn">
          <i class="fas fa-search"></i> 返回搜索
        </button>
      `;
      
      // 绑定返回按钮事件
      document.getElementById('back-to-search-btn').addEventListener('click', () => {
        // 清空自定义路径输入框
        if (pathSelect.value === 'custom') {
          customPath.value = '';
        }
        
        // 重置界面
        placeholder.innerHTML = `
          <div class="placeholder-icon">
            <i class="fas fa-copy"></i>
          </div>
          <h3>查找重复文件</h3>
          <p>选择要扫描的文件夹，然后点击上方按钮开始查找</p>
        `;
        placeholder.style.display = 'flex';
        resultsContainer.style.display = 'none';
      });
    } catch (error) {
      console.error('删除文件出错:', error);
      placeholder.innerHTML = `
        <div class="placeholder-icon">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <h3>删除出错</h3>
        <p>删除文件时出现错误: ${error.message}</p>
        <button class="primary-btn" id="back-to-results-btn">
          <i class="fas fa-arrow-left"></i> 返回结果
        </button>
      `;
      
      // 绑定返回按钮事件
      document.getElementById('back-to-results-btn').addEventListener('click', () => {
        placeholder.style.display = 'none';
        resultsContainer.style.display = 'block';
      });
    }
  });
}

// 初始化程序卸载功能
function initUninstall() {
    const appList = document.getElementById('installed-apps');
  const searchInput = document.getElementById('app-search');
  const sortSelect = document.getElementById('app-sort');
  let installedApps = []; // 存储所有应用程序数据
  
  // 加载已安装的程序列表
  async function loadInstalledApps() {
    appList.innerHTML = `
      <div class="loading-apps">
        <i class="fas fa-circle-notch fa-spin"></i>
        <p>正在加载已安装程序...</p>
      </div>
    `;
    
    try {
      // 从主进程获取已安装的程序列表
      installedApps = await ipcRenderer.invoke('get-installed-apps');
      
      if (!installedApps || installedApps.length === 0) {
        appList.innerHTML = `
          <div class="no-apps-message">
            <i class="fas fa-info-circle"></i>
            <p>未找到已安装的程序</p>
          </div>
        `;
        return;
      }
      
      // 显示程序列表
      displayAppList(installedApps);
      
      // 添加智能选择功能
      addSmartSelectButtons();
      
      // 设置默认排序
      sortAppList('name');
    } catch (error) {
      console.error('获取已安装程序列表失败:', error);
      appList.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>加载程序列表失败，请重试</p>
          <button id="retry-load-apps" class="primary-btn">
            <i class="fas fa-redo"></i> 重新加载
          </button>
        </div>
      `;
      
      // 添加重试按钮事件
      document.getElementById('retry-load-apps')?.addEventListener('click', loadInstalledApps);
    }
  }
  
  // 显示程序列表
  function displayAppList(apps) {
    // 清空列表
    appList.innerHTML = '';
    
    // 添加智能分类头部
    const smartSelectHeader = document.createElement('div');
    smartSelectHeader.className = 'smart-select-header';
    smartSelectHeader.innerHTML = `
      <h3>智能程序分类</h3>
      <div class="smart-select-buttons">
        <button id="select-rarely-used" class="smart-select-btn">
          <i class="fas fa-clock"></i> 筛选不常用
        </button>
        <button id="select-large-apps" class="smart-select-btn">
          <i class="fas fa-database"></i> 筛选大型程序
        </button>
        <button id="select-old-apps" class="smart-select-btn">
          <i class="fas fa-history"></i> 筛选旧程序
        </button>
        <button id="clear-filters" class="smart-select-btn">
          <i class="fas fa-eraser"></i> 清除筛选
        </button>
        </div>
      <div class="filtered-count">
        显示 ${apps.length}/${apps.length} 个程序
      </div>
    `;
    appList.appendChild(smartSelectHeader);
    
    // 创建表格容器
    const tableContainer = document.createElement('div');
    tableContainer.className = 'app-table-container';
    
    // 创建表格
    const table = document.createElement('table');
    table.className = 'app-table';
    
    // 添加表头
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th class="th-name">程序名称</th>
        <th class="th-publisher">发布商</th>
        <th class="th-version">版本</th>
        <th class="th-date">安装日期</th>
        <th class="th-size">大小</th>
        <th class="th-action">操作</th>
      </tr>
    `;
    table.appendChild(thead);
    
    // 创建表格内容
    const tbody = document.createElement('tbody');
    
    // 添加所有应用程序
    apps.forEach(app => {
      // 修复中文乱码问题 - 确保所有字符串都是有效的
      const name = decodeIfNeeded(app.name);
      const publisher = decodeIfNeeded(app.publisher);
      const version = decodeIfNeeded(app.version);
      
      const tr = document.createElement('tr');
      tr.className = 'app-row';
      tr.setAttribute('data-name', name);
      tr.setAttribute('data-publisher', publisher);
      tr.setAttribute('data-version', version);
      tr.setAttribute('data-date', app.installDate);
      tr.setAttribute('data-size', app.size);
      
      // 添加可搜索的关键词属性
      tr.setAttribute('data-keywords', `${name} ${publisher} ${version}`.toLowerCase());
      
      // 检查卸载字符串是否有效
      let uninstallString = app.uninstallString || '';
      let hasUninstallCmd = uninstallString.trim() !== '';
      
      // HTML转义卸载字符串，防止XSS攻击
      const escapedUninstallString = uninstallString.replace(/"/g, '&quot;');
      
      tr.innerHTML = `
        <td class="app-name">${name}</td>
        <td class="app-publisher">${publisher}</td>
        <td class="app-version">${version}</td>
        <td class="app-date">${app.installDate}</td>
        <td class="app-size">${app.size}</td>
        <td class="app-action">
          <button class="uninstall-btn" data-uninstall-string="${escapedUninstallString}" ${!hasUninstallCmd ? 'disabled' : ''} title="${!hasUninstallCmd ? '无卸载命令' : '卸载此程序'}">
            ${hasUninstallCmd ? '卸载' : '<i class="fas fa-ban"></i>'}
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    appList.appendChild(tableContainer);
    
    // 绑定卸载按钮事件
    document.querySelectorAll('.uninstall-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async function() {
        const uninstallString = this.getAttribute('data-uninstall-string').replace(/&quot;/g, '"');
        const appName = this.closest('tr').querySelector('.app-name').textContent;
        
        if (!uninstallString) {
          alert(`抱歉，无法卸载 ${appName}，未找到卸载命令。`);
          return;
        }
        
        if (confirm(`确定要卸载 ${appName} 吗？`)) {
          try {
            // 显示卸载中状态
            this.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
            this.disabled = true;
            
            // 调用主进程卸载应用
            const result = await ipcRenderer.invoke('uninstall-app', uninstallString);
            
            if (result.success) {
              // 卸载成功
              this.innerHTML = '<i class="fas fa-check"></i> 已启动';
              
              // 提示用户
              alert(`${appName} 的卸载程序已启动，请按照卸载向导完成卸载。完成后请刷新列表。`);
              
              // 移除旧的刷新按钮(如果存在)
              const oldRefreshBtn = this.parentNode.querySelector('.refresh-btn');
              if (oldRefreshBtn) {
                oldRefreshBtn.remove();
              }
              
              // 添加刷新按钮
              const refreshBtn = document.createElement('button');
              refreshBtn.className = 'refresh-btn';
              refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 刷新列表';
              refreshBtn.addEventListener('click', () => {
                // 显示加载状态
                const appList = document.getElementById('installed-apps');
                appList.innerHTML = `
                  <div class="loading-apps">
                    <i class="fas fa-circle-notch fa-spin"></i>
                    <p>正在重新加载已安装程序...</p>
                  </div>
                `;
                
                // 延迟一小段时间再加载，确保卸载程序有时间完成
                setTimeout(() => {
                  loadInstalledApps(); // 重新加载程序列表
                }, 1000);
              });
              
              this.parentNode.appendChild(refreshBtn);
            } else {
              // 卸载失败
              this.innerHTML = '卸载';
              this.disabled = false;
              alert(`卸载 ${appName} 失败: ${result.message}`);
            }
          } catch (error) {
            console.error('卸载应用时出错:', error);
            this.innerHTML = '卸载';
            this.disabled = false;
            alert(`卸载 ${appName} 时发生错误: ${error.message}`);
          }
        }
      });
    });
  }
    
    // 绑定搜索功能
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
    filterAppList(query);
  });
  
  // 绑定排序功能
  sortSelect.addEventListener('change', () => {
    sortAppList(sortSelect.value);
  });
  
  // 筛选应用列表
  function filterAppList(query) {
    const rows = document.querySelectorAll('.app-row');
    
    rows.forEach(row => {
      const keywords = row.getAttribute('data-keywords');
      if (keywords && keywords.includes(query)) {
        row.style.display = ''; // 显示匹配的行
        } else {
        row.style.display = 'none'; // 隐藏不匹配的行
      }
    });
    
    // 更新计数
    updateFilteredCount();
  }
  
  // 更新已筛选的计数
  function updateFilteredCount() {
    const totalRows = document.querySelectorAll('.app-row').length;
    const visibleRows = document.querySelectorAll('.app-row[style=""]').length + 
                         document.querySelectorAll('.app-row:not([style])').length +
                         document.querySelectorAll('.app-row[style="display: ;"]').length;
    
    const countElement = document.querySelector('.filtered-count');
    if (countElement) {
      countElement.textContent = `显示 ${visibleRows}/${totalRows} 个程序`;
    }
  }
  
  // 排序应用列表
  function sortAppList(sortBy) {
    const tbody = document.querySelector('.app-table tbody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // 根据排序字段排序
    rows.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'name':
          valueA = a.getAttribute('data-name') || '';
          valueB = b.getAttribute('data-name') || '';
          return valueA.localeCompare(valueB);
        
        case 'publisher':
          valueA = a.getAttribute('data-publisher') || '';
          valueB = b.getAttribute('data-publisher') || '';
          return valueA.localeCompare(valueB);
          
        case 'date':
          valueA = a.getAttribute('data-date') || '';
          valueB = b.getAttribute('data-date') || '';
          
          // 处理日期格式
          const dateA = valueA === 'Unknown' ? new Date(0) : new Date(valueA);
          const dateB = valueB === 'Unknown' ? new Date(0) : new Date(valueB);
          
          return dateB - dateA; // 默认按安装日期从新到旧排序
          
        case 'size':
          valueA = a.getAttribute('data-size') || '0';
          valueB = b.getAttribute('data-size') || '0';
          
          // 尝试解析大小字符串
          const sizeA = parseBytes(valueA);
          const sizeB = parseBytes(valueB);
          
          return sizeB - sizeA; // 默认按大小从大到小排序
          
        default:
          return 0;
        }
      });
    
    // 重新添加排序后的行
    rows.forEach(row => {
      tbody.appendChild(row);
    });
  }
  
  // 添加智能选择功能
  function addSmartSelectButtons() {
    // 绑定筛选不常用程序按钮
    document.getElementById('select-rarely-used').addEventListener('click', () => {
      // 清除现有筛选
      searchInput.value = '';
      
      // 显示所有行
      const rows = document.querySelectorAll('.app-row');
      rows.forEach(row => row.style.display = '');
      
      // 筛选出近期未使用的程序
      // 实际中我们没有真正的使用频率数据，这里模拟逻辑
      // 1. 安装日期较早的程序（1年以上）
      // 2. 系统自带程序通常比较基础不应当卸载
      
      const currentDate = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
      
      rows.forEach(row => {
        const date = row.getAttribute('data-date');
        const publisher = row.getAttribute('data-publisher').toLowerCase();
        const name = row.getAttribute('data-name').toLowerCase();
        
        // 如果安装日期是Unknown或一年以前，且不是Microsoft或系统程序
        const isOld = date === 'Unknown' || (new Date(date) < oneYearAgo);
        const isSystem = publisher.includes('microsoft') || 
                         publisher.includes('windows') || 
                         name.includes('windows') ||
                         name.includes('defender') ||
                         name.includes('security');
        
        if (isOld && !isSystem) {
          row.style.display = ''; // 显示
          row.classList.add('highlighted-row');
        } else {
          row.style.display = 'none'; // 隐藏
          row.classList.remove('highlighted-row');
        }
      });
      
      // 更新计数
      updateFilteredCount();
    });
    
    // 绑定筛选大型程序按钮
    document.getElementById('select-large-apps').addEventListener('click', () => {
      // 清除现有筛选
      searchInput.value = '';
      
      // 显示所有行
      const rows = document.querySelectorAll('.app-row');
      rows.forEach(row => row.style.display = '');
      
      // 筛选出大型程序（大于500MB）
      rows.forEach(row => {
        const sizeStr = row.getAttribute('data-size');
        const size = parseBytes(sizeStr);
        
        // 500MB = 500 * 1024 * 1024 = 524288000
        if (size > 524288000) {
          row.style.display = ''; // 显示
          row.classList.add('highlighted-row');
        } else {
          row.style.display = 'none'; // 隐藏
          row.classList.remove('highlighted-row');
        }
      });
      
      // 更新计数
      updateFilteredCount();
    });
    
    // 绑定筛选旧程序按钮
    document.getElementById('select-old-apps').addEventListener('click', () => {
      // 清除现有筛选
      searchInput.value = '';
      
      // 显示所有行
      const rows = document.querySelectorAll('.app-row');
      rows.forEach(row => row.style.display = '');
      
      // 筛选出安装日期较早的程序（2年以上）
      const currentDate = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(currentDate.getFullYear() - 2);
      
      rows.forEach(row => {
        const date = row.getAttribute('data-date');
        if (date !== 'Unknown') {
          const installDate = new Date(date);
          if (installDate < twoYearsAgo) {
            row.style.display = ''; // 显示
            row.classList.add('highlighted-row');
          } else {
            row.style.display = 'none'; // 隐藏
            row.classList.remove('highlighted-row');
          }
        } else {
          row.style.display = 'none'; // 隐藏未知日期
          row.classList.remove('highlighted-row');
        }
      });
      
      // 更新计数
      updateFilteredCount();
    });
    
    // 绑定清除筛选按钮
    document.getElementById('clear-filters').addEventListener('click', () => {
      // 清除搜索框
      searchInput.value = '';
      
      // 显示所有行
      const rows = document.querySelectorAll('.app-row');
      rows.forEach(row => {
        row.style.display = '';
        row.classList.remove('highlighted-row');
      });
      
      // 更新计数
      updateFilteredCount();
    });
  }
  
  // 添加自定义样式
  function addCustomStyles() {
    // 创建一个新的样式元素
    const style = document.createElement('style');
    style.textContent = `
      .app-table-container {
        max-height: 500px;
        overflow-y: auto;
        margin-top: 10px;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
      }
      
      .app-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .app-table th, .app-table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .app-table th {
        background-color: #f5f5f5;
        font-weight: 600;
        position: sticky;
        top: 0;
        z-index: 1;
      }
      
      .app-table tbody tr:hover {
        background-color: #f0f7ff;
      }
      
      .smart-select-header {
        margin-bottom: 10px;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .smart-select-header h3 {
        margin: 0;
        font-size: 16px;
        color: #333;
      }
      
      .smart-select-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .smart-select-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        background-color: #e8f4fd;
        color: #0078d7;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 13px;
      }
      
      .smart-select-btn:hover {
        background-color: #d0e8fd;
      }
      
      .filtered-count {
        margin-top: 5px;
        font-size: 12px;
        color: #666;
      }
      
      .highlighted-row {
        background-color: #fff8e1;
      }
      
      .highlighted-row:hover {
        background-color: #ffecb3;
      }
      
      .uninstall-btn {
        padding: 5px 10px;
        background-color: #f44336;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .uninstall-btn:hover {
        background-color: #d32f2f;
      }
      
      .uninstall-btn:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      
      .refresh-btn {
        padding: 5px 10px;
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 5px;
        transition: background-color 0.2s;
      }
      
      .refresh-btn:hover {
        background-color: #388e3c;
      }
      
      .th-name { width: 25%; }
      .th-publisher { width: 20%; }
      .th-version { width: 15%; }
      .th-date { width: 15%; }
      .th-size { width: 10%; }
      .th-action { width: 15%; }
      
      .error-message, .no-apps-message {
        padding: 20px;
        text-align: center;
        color: #666;
      }
      
      .error-message i, .no-apps-message i {
        font-size: 24px;
        color: #f44336;
        margin-bottom: 10px;
      }
      
      .no-apps-message i {
        color: #2196f3;
      }
    `;
    
    // 添加到文档头部
    document.head.appendChild(style);
  }
  
  // 添加自定义样式
  addCustomStyles();
  
  // 加载已安装的程序
  loadInstalledApps();
}

// 显示消息提示
function showToast(message, type = 'success') {
  // 创建Toast元素
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // 根据类型选择图标
  let iconClass = '';
  switch (type) {
    case 'success':
      iconClass = 'fa-check-circle';
      break;
    case 'error':
      iconClass = 'fa-exclamation-circle';
      break;
    case 'info':
      iconClass = 'fa-info-circle';
      break;
    case 'warning':
      iconClass = 'fa-exclamation-triangle';
      break;
    default:
      iconClass = 'fa-info-circle';
  }
  
  toast.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <span>${message}</span>
  `;
  
  // 查找现有的同类型toast
  const existingToasts = document.querySelectorAll(`.toast.${type}`);
  if (existingToasts.length > 0) {
    // 如果已经有同类型的toast，移除它
    existingToasts.forEach(existing => {
      existing.classList.remove('show');
      setTimeout(() => {
        if (existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }
      }, 300);
    });
  }
  
  // 添加到页面
  document.body.appendChild(toast);
  
  // 显示Toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // 3秒后隐藏并移除
  const timeout = type === 'error' ? 5000 : 3000; // 错误消息显示更长时间
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, timeout);
}

// 初始化关于弹窗功能
function initAboutModal() {
  const aboutModal = document.getElementById('about-modal');
  const showAboutBtn = document.getElementById('show-about-btn');
  const closeAboutBtn = document.getElementById('about-close-btn');
  const sidebarWechatBtn = document.getElementById('sidebar-wechat-btn');
  const modalContent = aboutModal.querySelector('.modal-content');
  const modalHeader = aboutModal.querySelector('.modal-header');
  const resetSizeBtn = document.getElementById('reset-modal-size');
  
  // 重置弹窗大小函数
  function resetModalSize() {
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '500px';
    modalContent.style.height = 'auto';
    modalContent.style.position = '';
    modalContent.style.top = '';
    modalContent.style.left = '';
    modalContent.style.margin = '';
  }
  
  // 重置按钮点击事件
  if (resetSizeBtn) {
    resetSizeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      resetModalSize();
    });
  }
  
  // 实现弹窗拖动功能
  let isDragging = false;
  let offsetX, offsetY;
  
  // 鼠标按下时开始拖动
  modalHeader.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - modalContent.getBoundingClientRect().left;
    offsetY = e.clientY - modalContent.getBoundingClientRect().top;
    modalContent.style.transition = 'none'; // 拖动时取消过渡效果
  });
  
  // 鼠标移动时拖动弹窗
  const mouseMoveHandler = (e) => {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // 确保不会拖出屏幕边界
    const maxX = window.innerWidth - modalContent.offsetWidth;
    const maxY = window.innerHeight - modalContent.offsetHeight;
    
    modalContent.style.left = `${Math.max(0, Math.min(maxX, x))}px`;
    modalContent.style.top = `${Math.max(0, Math.min(maxY, y))}px`;
    modalContent.style.position = 'fixed';
    modalContent.style.margin = '0';
  };
  
  // 鼠标释放时结束拖动
  const mouseUpHandler = () => {
    isDragging = false;
  };
  
  document.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseup', mouseUpHandler);
  
  // 调整弹窗大小时自适应内容
  if (typeof ResizeObserver !== 'undefined') {
    let resizeObserver = new ResizeObserver(() => {
      const modalBody = modalContent.querySelector('.modal-body');
      if (modalBody) {
        modalBody.style.maxHeight = `${modalContent.clientHeight - 150}px`;
      }
    });
    
    resizeObserver.observe(modalContent);
  } else {
    // 兼容性处理，为不支持ResizeObserver的浏览器添加窗口大小变化监听
    window.addEventListener('resize', () => {
      const modalBody = modalContent.querySelector('.modal-body');
      if (modalBody && modalContent.offsetHeight > 0) {
        modalBody.style.maxHeight = `${modalContent.clientHeight - 150}px`;
      }
    });
  }
  
  // 主页"关于"按钮事件
  if (showAboutBtn) {
    showAboutBtn.addEventListener('click', () => {
      aboutModal.style.display = 'flex';
      resetModalSize(); // 使用重置函数
    });
  }
  
  // 侧边栏微信图标事件
  if (sidebarWechatBtn) {
    sidebarWechatBtn.addEventListener('click', () => {
      aboutModal.style.display = 'flex';
      resetModalSize(); // 使用重置函数
      
      // 滚动到公众号部分
      setTimeout(() => {
        const wechatSection = document.querySelector('.wechat-section');
        if (wechatSection) {
          wechatSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    });
  }
  
  // 关闭按钮事件
  if (closeAboutBtn) {
    closeAboutBtn.addEventListener('click', () => {
      aboutModal.style.display = 'none';
    });
  }
  
  // 点击弹窗外部关闭弹窗
  window.addEventListener('click', (event) => {
    if (event.target === aboutModal) {
      aboutModal.style.display = 'none';
    }
  });
}

// 工具函数：格式化字节大小
function formatBytes(bytes, decimals = 2) {
  // 类型验证与异常值处理
  if (bytes === undefined || bytes === null || isNaN(bytes)) {
    console.warn('formatBytes接收到无效值:', bytes);
    return '未知';
  }
  
  // 确保bytes是数字
  bytes = Number(bytes);
  
  if (bytes < 0) {
    console.warn('formatBytes接收到负数:', bytes);
    bytes = 0; // 转换为0处理
  }
  
  if (bytes === 0) return '0 Bytes';
  
  try {
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    if (i < 0 || i >= sizes.length) {
      console.warn('formatBytes计算的单位索引超出范围:', i);
      // 返回原始字节数
      return bytes + ' Bytes';
    }
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  } catch (error) {
    console.error('formatBytes处理时出错:', error);
    return bytes + ' Bytes'; // 返回未格式化的字节数作为降级处理
  }
}

// 工具函数：解析格式化的字节大小字符串
function parseBytes(sizeStr) {
  const sizes = {'B': 1, 'KB': 1024, 'MB': 1024*1024, 'GB': 1024*1024*1024, 'TB': 1024*1024*1024*1024};
  const regex = /(\d+(\.\d+)?)\s*(B|KB|MB|GB|TB)/i;
  const match = sizeStr.match(regex);
  
  if (match) {
    const size = parseFloat(match[1]);
    const unit = match[3].toUpperCase();
    return size * sizes[unit];
  }
  
  return 0;
}

// 工具函数：获取路径的显示名称
function getPathDisplayName(path) {
  // 常见系统目录的友好名称
  const knownLocations = {
    'C:\\Windows\\Temp': 'Windows 临时文件',
    'C:\\Users\\AppData\\Local\\Temp': '应用临时文件',
    'C:\\Users\\Downloads': '下载文件夹',
    'AppData\\Local\\Google\\Chrome': 'Chrome 浏览器缓存',
    'AppData\\Local\\Microsoft\\Windows\\INetCache': 'Internet 临时文件'
  };
  
  // 尝试匹配已知位置
  for (const [key, value] of Object.entries(knownLocations)) {
    if (path.includes(key)) {
      return value;
    }
  }
  
  // 如果没有匹配，返回路径的最后一部分
  const parts = path.split('\\');
  return parts[parts.length - 1];
}

// 添加图片错误处理功能
function addImageErrorHandlers() {
  // 为所有图片添加错误处理
  const allImages = document.querySelectorAll('img');
  
  allImages.forEach(img => {
    img.onerror = function() {
      console.error(`图片加载失败: ${this.src}`);
      
      // 根据类名判断图片类型
      if (this.classList.contains('next-wave-logo') || this.classList.contains('next-wave-logo-lg')) {
        // 替换为文本
        const textNode = document.createElement('div');
        textNode.textContent = 'Next Wave';
        textNode.style.fontWeight = 'bold';
        textNode.style.color = '#333';
        textNode.style.padding = '5px';
        textNode.style.textAlign = 'center';
        this.parentNode.replaceChild(textNode, this);
      } else if (this.classList.contains('wechat-qrcode-img')) {
        // 替换为二维码占位
        const qrPlaceholder = document.createElement('div');
        qrPlaceholder.innerHTML = '<i class="fas fa-qrcode" style="font-size: 100px; color: #4CAF50;"></i>';
        qrPlaceholder.style.display = 'flex';
        qrPlaceholder.style.justifyContent = 'center';
        qrPlaceholder.style.alignItems = 'center';
        qrPlaceholder.style.width = '180px';
        qrPlaceholder.style.height = '180px';
        qrPlaceholder.style.backgroundColor = '#f9f9f9';
        qrPlaceholder.style.border = '1px solid #eee';
        this.parentNode.replaceChild(qrPlaceholder, this);
      }
    };
  });
} 

// 添加一个辅助函数用于修复乱码
function decodeIfNeeded(text) {
  // 如果为空，返回Unknown
  if (!text) return 'Unknown';
  
  // 检测是否是特殊格式的变量名占位符，如${(arpDisplayName)}
  if (text.includes('${(') && text.includes(')}')) {
    console.log(`检测到变量占位符: ${text}`);
    return 'Unknown'; // 返回Unknown而不是占位符
  }
  
  try {
    // 检测是否有乱码特征（常见的UTF-8乱码特征）
    const hasEncodingIssue = /[\u0080-\u00ff]{4,}/.test(text) || /\uFFFD{2,}/.test(text);
    
    // 尝试清理乱码
    if (hasEncodingIssue) {
      console.log(`检测到乱码文本: ${text}`);
      
      // 乱码映射表
      const encodingMap = {
        "鑾峰彇": "获取",
        "绯荤粺": "系统",
        "宸插畨": "已安",
        "瑁呯▼": "装程",
        "搴忓垪": "序列",
        "琛?": "表",
        "鏂规硶": "方法",
        "绋嬪簭": "程序",
        "鎴愬姛": "成功",
        "瀹夎": "安装",
        "鍗歌浇": "卸载",
        "杞欢": "软件",
        "鏈夋晥": "有效",
        "鍔熻兘": "功能",
        "閿欒": "错误"
      };
      
      // 应用映射表
      let fixedText = text;
      for (const [garbled, fixed] of Object.entries(encodingMap)) {
        fixedText = fixedText.replace(new RegExp(garbled, 'g'), fixed);
      }
      
      // 清理通用乱码字符
      if (fixedText === text) {
        fixedText = text.replace(/[\uFFFD\uD800-\uDFFF\u0080-\u00FF]+/g, ' ').trim();
      }
      
      // 如果有改变，使用修复后的文本
      if (fixedText !== text) {
        console.log(`乱码修复结果: ${fixedText}`);
        text = fixedText;
      }
    }
    
    // 专门处理Office产品
    if (text.includes('Microsoft') && 
        (text.includes('Office') || text.includes('Project') || text.includes('Visio'))) {
      
      // 提取产品类型
      let productType = '';
      if (text.includes('Office')) productType = 'Office';
      else if (text.includes('Project')) productType = 'Project';
      else if (text.includes('Visio')) productType = 'Visio';
      
      // 提取年份
      let year = '';
      if (text.includes('2024')) year = '2024';
      else if (text.includes('2021')) year = '2021';
      else if (text.includes('2019')) year = '2019';
      else if (text.includes('2016')) year = '2016';
      else if (text.includes('365')) year = '365';
      
      // 如果提取到了足够信息
      if (productType) {
        const newName = `Microsoft ${productType}${year ? ' ' + year : ''}`;
        return newName;
      }
    }
    
    return text;
  } catch (e) {
    console.error('处理文本时出错:', e);
    return text;
  }
} 