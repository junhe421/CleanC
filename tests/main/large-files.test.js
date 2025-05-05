const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('大文件查找功能测试', () => {
  test('应该能正确查找大文件', async () => {
    // 设置fs模块的模拟行为
    const mockFiles = ['file1.txt', 'file2.txt', 'file3.txt', 'subfolder'];
    const mockStats = {
      size: 1024 * 1024 * 150, // 150MB
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false
    };
    
    // 模拟目录下有大文件
    fs.readdirSync.mockReturnValue(mockFiles);
    fs.statSync.mockReturnValue(mockStats);
    
    // 加载主进程模块
    require('../../main.js');
    
    // 找到处理大文件查找的处理函数
    const getLargeFilesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'get-large-files');
    expect(getLargeFilesCall).toBeDefined();
    
    const getLargeFilesHandler = getLargeFilesCall[1];
    
    // 调用处理函数，100MB为最小文件大小
    const result = await getLargeFilesHandler({}, 100);
    
    // 验证结果是否符合预期
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // 检查返回的文件信息
    const fileInfo = result[0];
    expect(fileInfo.path).toBeDefined();
    expect(fileInfo.size).toBe(mockStats.size);
    expect(fileInfo.lastModified).toBeDefined();
    
    // 验证文件系统操作被正确调用
    expect(fs.readdirSync).toHaveBeenCalled();
    expect(fs.statSync).toHaveBeenCalled();
  });

  test('处理文件访问被拒绝等错误', async () => {
    // 模拟readdirSync抛出"访问被拒绝"错误
    fs.readdirSync.mockImplementationOnce(() => {
      throw new Error('访问被拒绝');
    });
    
    // 加载主进程模块
    require('../../main.js');
    
    // 获取大文件查找处理函数
    const getLargeFilesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'get-large-files');
    const getLargeFilesHandler = getLargeFilesCall[1];
    
    // 调用处理函数
    const result = await getLargeFilesHandler({}, 100);
    
    // 即使出错应该返回空数组，而不是抛出异常
    expect(result).toEqual([]);
  });

  test('忽略小于指定大小的文件', async () => {
    // 设置一个小文件和一个大文件
    const smallFileStats = {
      size: 1024 * 1024 * 50, // 50MB
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false
    };
    
    const largeFileStats = {
      size: 1024 * 1024 * 150, // 150MB
      mtime: new Date(),
      isFile: () => true,
      isDirectory: () => false
    };
    
    // 模拟读取目录返回两个文件
    fs.readdirSync.mockReturnValue(['small_file.txt', 'large_file.txt']);
    
    // 根据文件名返回不同的统计信息
    fs.statSync.mockImplementation((filePath) => {
      if (filePath.includes('small_file')) {
        return smallFileStats;
      } else {
        return largeFileStats;
      }
    });
    
    // 加载主进程模块
    require('../../main.js');
    
    // 获取大文件查找处理函数
    const getLargeFilesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'get-large-files');
    const getLargeFilesHandler = getLargeFilesCall[1];
    
    // 设置最小文件大小为100MB调用
    const result = await getLargeFilesHandler({}, 100);
    
    // 应该只返回大文件，小文件被过滤掉
    expect(result.length).toBe(1);
    expect(result[0].size).toBe(largeFileStats.size);
  });
}); 