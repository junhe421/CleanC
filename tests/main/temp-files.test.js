const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  
  // 确保process.env.USERNAME存在
  process.env.USERNAME = 'TestUser';
});

describe('临时文件扫描和清理功能测试', () => {
  test('扫描临时文件应该返回正确的结果', async () => {
    // 设置模拟的文件系统行为
    fs.existsSync.mockReturnValue(true);
    
    // 加载主进程模块
    require('../../main.js');
    
    // 查找临时文件扫描的处理函数
    const scanTempFilesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'scan-temp-files');
    expect(scanTempFilesCall).toBeDefined();
    
    const scanTempFilesHandler = scanTempFilesCall[1];
    
    // 调用处理函数
    const result = await scanTempFilesHandler();
    
    // 验证结果是否符合预期
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // 检查结果中是否包含Windows Temp目录
    const winTempPath = result.find(item => item.path === 'C:\\Windows\\Temp');
    expect(winTempPath).toBeDefined();
    expect(winTempPath.safeToDelete).toBe(true);
    
    // 检查结果中是否包含用户Temp目录
    const userTempPath = result.find(item => item.path.includes('AppData\\Local\\Temp'));
    expect(userTempPath).toBeDefined();
    expect(userTempPath.safeToDelete).toBe(true);
    
    // 验证文件系统操作被正确调用
    expect(fs.existsSync).toHaveBeenCalled();
  });

  test('清理临时文件应该正确处理选定的项目', async () => {
    // 加载主进程模块
    require('../../main.js');
    
    // 查找清理临时文件的处理函数
    const cleanTempFilesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'clean-temp-files');
    expect(cleanTempFilesCall).toBeDefined();
    
    const cleanTempFilesHandler = cleanTempFilesCall[1];
    
    // 创建模拟的清理项目
    const mockItems = [
      { path: 'C:\\Windows\\Temp', selected: true, safeToDelete: true },
      { path: 'C:\\Users\\TestUser\\AppData\\Local\\Temp', selected: true, safeToDelete: true },
      { path: 'C:\\Users\\TestUser\\Downloads', selected: false, safeToDelete: false }
    ];
    
    // 调用处理函数
    const result = await cleanTempFilesHandler({}, mockItems);
    
    // 验证结果
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // 应该只处理选中且安全的项目
    expect(result.length).toBe(2);
    
    // 验证每个处理结果
    result.forEach(item => {
      expect(item.path).toBeDefined();
      expect(item.success).toBeDefined();
      expect(item.message).toBeDefined();
    });
    
    // 检查是否所有选中且安全的项目都成功处理了
    const successItems = result.filter(item => item.success);
    expect(successItems.length).toBe(2);
  });

  test('处理清理文件时的错误情况', async () => {
    // 模拟删除文件时出错
    fs.unlinkSync.mockImplementation(() => {
      throw new Error('模拟的删除错误');
    });
    
    // 加载主进程模块
    require('../../main.js');
    
    // 查找清理临时文件的处理函数
    const cleanTempFilesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'clean-temp-files');
    const cleanTempFilesHandler = cleanTempFilesCall[1];
    
    // 创建模拟的清理项目（只选择一个项目进行简化）
    const mockItems = [
      { path: 'C:\\Windows\\Temp', selected: true, safeToDelete: true }
    ];
    
    // 调用处理函数
    const result = await cleanTempFilesHandler({}, mockItems);
    
    // 验证结果
    expect(result.length).toBe(1);
    
    // 应该报告失败
    expect(result[0].success).toBe(false);
    expect(result[0].message).toContain('无法清理目录');
  });
}); 