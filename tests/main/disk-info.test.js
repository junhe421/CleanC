const { ipcMain } = require('electron');
const nodeDiskInfo = require('node-disk-info');

// 在测试前重置模块，确保每个测试用独立的环境
beforeEach(() => {
  jest.resetModules();
  
  // 清除所有模拟函数的调用记录
  jest.clearAllMocks();
});

describe('磁盘信息功能测试', () => {
  // 测试处理磁盘信息请求
  test('应该正确处理获取磁盘信息的请求', async () => {
    // 加载主进程模块
    require('../../main.js');
    
    // 获取ipcMain.handle方法的所有调用
    const handleCalls = ipcMain.handle.mock.calls;
    
    // 找到处理'get-disk-info'频道的处理函数
    const getDiskInfoCall = handleCalls.find(call => call[0] === 'get-disk-info');
    expect(getDiskInfoCall).toBeDefined();
    
    // 获取处理函数
    const getDiskInfoHandler = getDiskInfoCall[1];
    
    // 直接调用处理函数
    const result = await getDiskInfoHandler();
    
    // 验证结果包含C盘信息
    expect(result).toHaveLength(1);
    expect(result[0].mounted).toBe('C:');
    expect(result[0].available).toBeDefined();
    expect(result[0].used).toBeDefined();
    expect(result[0].blocks).toBeDefined();
    
    // 验证nodeDiskInfo.getDiskInfoSync被调用
    expect(nodeDiskInfo.getDiskInfoSync).toHaveBeenCalled();
  });

  // 测试处理磁盘信息请求的错误情况
  test('当获取磁盘信息出错时应返回null', async () => {
    // 模拟getDiskInfoSync抛出错误
    nodeDiskInfo.getDiskInfoSync.mockImplementationOnce(() => {
      throw new Error('模拟的磁盘信息错误');
    });
    
    // 加载主进程模块
    require('../../main.js');
    
    // 获取处理'get-disk-info'频道的处理函数
    const getDiskInfoCall = ipcMain.handle.mock.calls.find(call => call[0] === 'get-disk-info');
    const getDiskInfoHandler = getDiskInfoCall[1];
    
    // 直接调用处理函数
    const result = await getDiskInfoHandler();
    
    // 验证错误情况下返回null
    expect(result).toBeNull();
  });
}); 