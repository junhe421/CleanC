const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// 在每个测试之前重置模块和清除模拟
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  
  // 设置用户路径
  process.env.USERPROFILE = 'C:\\Users\\TestUser';
});

describe('重复文件查找和删除功能测试', () => {
  test('查找重复文件 - 文档目录路径', async () => {
    // 模拟fs模块和文件哈希
    const mockFileHash = '1234567890abcdef';
    
    // 加载主进程模块
    const mainModule = require('../../main.js');
    
    // 查找重复文件处理函数
    const findDuplicatesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'find-duplicate-files');
    expect(findDuplicatesCall).toBeDefined();
    
    const findDuplicatesHandler = findDuplicatesCall[1];
    
    // 调用处理函数，使用'documents'作为搜索路径
    const result = await findDuplicatesHandler({}, 'documents');
    
    // 验证结果格式
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.duplicateGroups).toBeDefined();
    expect(result.totalFiles).toBeDefined();
    expect(result.searchPath).toContain('Documents');
    
    // 验证文件系统操作被正确调用
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.readdirSync).toHaveBeenCalled();
  });

  test('查找重复文件 - 自定义路径', async () => {
    // 加载主进程模块
    require('../../main.js');
    
    // 查找处理函数
    const findDuplicatesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'find-duplicate-files');
    const findDuplicatesHandler = findDuplicatesCall[1];
    
    // 调用处理函数，使用自定义路径
    const customPath = 'C:\\MyCustomPath';
    const result = await findDuplicatesHandler({}, `custom:${customPath}`);
    
    // 验证路径处理
    expect(result.searchPath).toBe(customPath);
  });

  test('查找重复文件 - 路径不存在', async () => {
    // 模拟路径不存在
    fs.existsSync.mockReturnValueOnce(false);
    
    // 加载主进程模块
    require('../../main.js');
    
    // 查找处理函数
    const findDuplicatesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'find-duplicate-files');
    const findDuplicatesHandler = findDuplicatesCall[1];
    
    // 调用处理函数
    const result = await findDuplicatesHandler({}, 'documents');
    
    // 验证错误处理
    expect(result.error).toBeDefined();
    expect(result.error).toContain('路径不存在');
  });

  test('删除重复文件', async () => {
    // 加载主进程模块
    require('../../main.js');
    
    // 查找删除重复文件的处理函数
    const deleteDuplicatesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'delete-duplicate-files');
    expect(deleteDuplicatesCall).toBeDefined();
    
    const deleteDuplicatesHandler = deleteDuplicatesCall[1];
    
    // 创建模拟的要删除的文件
    const mockFilesToDelete = [
      { path: 'C:\\Users\\TestUser\\Documents\\duplicate1.txt' },
      { path: 'C:\\Users\\TestUser\\Documents\\duplicate2.txt' }
    ];
    
    // 模拟文件存在
    fs.existsSync.mockReturnValue(true);
    
    // 调用处理函数
    const result = await deleteDuplicatesHandler({}, mockFilesToDelete);
    
    // 验证结果
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    
    // 验证每个删除操作的结果
    result.forEach(item => {
      expect(item.path).toBeDefined();
      expect(item.success).toBe(true);
      expect(item.message).toBeDefined();
    });
    
    // 验证文件删除操作被调用
    expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
  });

  test('删除不存在的重复文件', async () => {
    // 加载主进程模块
    require('../../main.js');
    
    // 获取删除处理函数
    const deleteDuplicatesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'delete-duplicate-files');
    const deleteDuplicatesHandler = deleteDuplicatesCall[1];
    
    // 模拟文件不存在
    fs.existsSync.mockReturnValue(false);
    
    // 创建模拟的要删除的文件
    const mockFilesToDelete = [
      { path: 'C:\\Users\\TestUser\\Documents\\nonexistent.txt' }
    ];
    
    // 调用处理函数
    const result = await deleteDuplicatesHandler({}, mockFilesToDelete);
    
    // 验证结果
    expect(result[0].success).toBe(false);
    expect(result[0].message).toContain('文件不存在');
    
    // 验证没有尝试删除不存在的文件
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
}); 