/**
 * 主进程文件操作功能测试
 * 测试打开文件位置和删除单个文件的IPC处理程序
 */

const { ipcMain, shell } = require('electron');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

// 在每个测试之前重置模块和模拟函数
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('文件操作功能测试', () => {
  describe('打开文件位置功能', () => {
    test('打开有效文件位置应返回成功', async () => {
      // 加载主进程模块
      require('../../main.js');
      
      // 模拟文件存在
      fs.existsSync.mockReturnValue(true);
      
      // 查找处理'open-file-location'的IPC处理程序
      const openFileLocationCall = ipcMain.handle.mock.calls.find(call => call[0] === 'open-file-location');
      expect(openFileLocationCall).toBeDefined();
      
      const openFileLocationHandler = openFileLocationCall[1];
      
      // 调用处理程序
      const filePath = 'C:\\Users\\Test\\Documents\\testfile.txt';
      const result = await openFileLocationHandler({}, filePath);
      
      // 验证结果
      expect(result.success).toBe(true);
      
      // 验证shell.showItemInFolder被调用
      expect(shell.showItemInFolder).toHaveBeenCalledWith(filePath);
    });
    
    test('处理HTML转义的文件路径', async () => {
      // 加载主进程模块
      require('../../main.js');
      
      // 模拟文件存在
      fs.existsSync.mockReturnValue(true);
      
      // 获取IPC处理程序
      const openFileLocationCall = ipcMain.handle.mock.calls.find(call => call[0] === 'open-file-location');
      const openFileLocationHandler = openFileLocationCall[1];
      
      // 调用处理程序，使用HTML转义的路径
      const escapedPath = 'C:\\Users\\Test\\Documents\\test&quot;file&quot;.txt';
      const unescapedPath = 'C:\\Users\\Test\\Documents\\test"file".txt';
      await openFileLocationHandler({}, escapedPath);
      
      // 验证shell.showItemInFolder被调用，且使用了未转义的路径
      expect(shell.showItemInFolder).toHaveBeenCalledWith(unescapedPath);
    });
    
    test('处理文件不存在的情况', async () => {
      // 加载主进程模块
      require('../../main.js');
      
      // 模拟文件不存在
      fs.existsSync.mockReturnValue(false);
      
      // 获取IPC处理程序
      const openFileLocationCall = ipcMain.handle.mock.calls.find(call => call[0] === 'open-file-location');
      const openFileLocationHandler = openFileLocationCall[1];
      
      // 调用处理程序
      const filePath = 'C:\\Users\\Test\\Documents\\nonexistent.txt';
      const result = await openFileLocationHandler({}, filePath);
      
      // 验证错误处理
      expect(result.success).toBe(false);
      expect(result.error).toContain('文件不存在');
      
      // 验证shell.showItemInFolder没有被调用
      expect(shell.showItemInFolder).not.toHaveBeenCalled();
    });
    
    test('使用替代方法打开目录', async () => {
      // 加载主进程模块
      require('../../main.js');
      
      // 模拟文件存在
      fs.existsSync.mockReturnValue(true);
      
      // 模拟showItemInFolder抛出错误
      shell.showItemInFolder.mockImplementationOnce(() => {
        throw new Error('showItemInFolder失败');
      });
      
      // 获取IPC处理程序
      const openFileLocationCall = ipcMain.handle.mock.calls.find(call => call[0] === 'open-file-location');
      const openFileLocationHandler = openFileLocationCall[1];
      
      // 调用处理程序
      const filePath = 'C:\\Users\\Test\\Documents\\testfile.txt';
      const result = await openFileLocationHandler({}, filePath);
      
      // 验证结果
      expect(result.success).toBe(true);
      
      // 验证尝试使用替代方法
      expect(shell.openPath).toHaveBeenCalledWith(path.dirname(filePath));
    });
  });
  
  describe('删除文件功能', () => {
    test('成功删除单个文件', async () => {
      // 加载主进程模块
      require('../../main.js');
      
      // 模拟文件存在
      fs.existsSync.mockReturnValue(true);
      
      // 查找处理'delete-large-files'的IPC处理程序
      const deleteLargeFilesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'delete-large-files');
      expect(deleteLargeFilesCall).toBeDefined();
      
      const deleteLargeFilesHandler = deleteLargeFilesCall[1];
      
      // 调用处理程序
      const filePath = 'C:\\Users\\Test\\Documents\\testfile.txt';
      const result = await deleteLargeFilesHandler({}, [filePath]);
      
      // 验证结果
      expect(result.length).toBe(1);
      expect(result[0].success).toBe(true);
      expect(result[0].filePath).toBe(filePath);
      
      // 验证fs.unlinkSync被调用
      expect(fs.unlinkSync).toHaveBeenCalledWith(filePath);
    });
    
    test('处理HTML转义的文件路径', async () => {
      // 加载主进程模块
      require('../../main.js');
      
      // 模拟文件存在
      fs.existsSync.mockReturnValue(true);
      
      // 获取IPC处理程序
      const deleteLargeFilesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'delete-large-files');
      const deleteLargeFilesHandler = deleteLargeFilesCall[1];
      
      // 调用处理程序，使用HTML转义的路径
      const escapedPath = 'C:\\Users\\Test\\Documents\\test&quot;file&quot;.txt';
      const unescapedPath = 'C:\\Users\\Test\\Documents\\test"file".txt';
      await deleteLargeFilesHandler({}, [escapedPath]);
      
      // 验证fs.unlinkSync被调用，且使用了未转义的路径
      expect(fs.unlinkSync).toHaveBeenCalledWith(unescapedPath);
    });
    
    test('处理文件不存在的情况', async () => {
      // 加载主进程模块
      require('../../main.js');
      
      // 模拟文件不存在
      fs.existsSync.mockReturnValue(false);
      
      // 获取IPC处理程序
      const deleteLargeFilesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'delete-large-files');
      const deleteLargeFilesHandler = deleteLargeFilesCall[1];
      
      // 调用处理程序
      const filePath = 'C:\\Users\\Test\\Documents\\nonexistent.txt';
      const result = await deleteLargeFilesHandler({}, [filePath]);
      
      // 验证错误处理
      expect(result.length).toBe(1);
      expect(result[0].success).toBe(false);
      expect(result[0].error).toContain('文件不存在');
      
      // 验证fs.unlinkSync没有被调用
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
    
    test('使用系统命令删除文件', async () => {
      // 加载主进程模块
      require('../../main.js');
      
      // 模拟文件存在
      fs.existsSync.mockReturnValue(true);
      
      // 模拟fs.unlinkSync抛出错误
      fs.unlinkSync.mockImplementationOnce(() => {
        throw new Error('权限不足');
      });
      
      // 获取IPC处理程序
      const deleteLargeFilesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'delete-large-files');
      const deleteLargeFilesHandler = deleteLargeFilesCall[1];
      
      // 调用处理程序
      const filePath = 'C:\\Users\\Test\\Documents\\testfile.txt';
      const result = await deleteLargeFilesHandler({}, [filePath]);
      
      // 验证尝试使用系统命令
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('del'));
      
      // 验证结果
      expect(result.length).toBe(1);
      expect(result[0].success).toBe(true);
      expect(result[0].message).toContain('使用系统命令');
    });
    
    test('处理多个文件的删除', async () => {
      // 加载主进程模块
      require('../../main.js');
      
      // 模拟文件存在
      fs.existsSync.mockReturnValue(true);
      
      // 获取IPC处理程序
      const deleteLargeFilesCall = ipcMain.handle.mock.calls.find(call => call[0] === 'delete-large-files');
      const deleteLargeFilesHandler = deleteLargeFilesCall[1];
      
      // 调用处理程序，传入多个文件路径
      const filePaths = [
        'C:\\Users\\Test\\Documents\\file1.txt',
        'C:\\Users\\Test\\Documents\\file2.txt',
        'C:\\Users\\Test\\Documents\\file3.txt'
      ];
      
      const result = await deleteLargeFilesHandler({}, filePaths);
      
      // 验证结果
      expect(result.length).toBe(3);
      result.forEach(item => {
        expect(item.success).toBe(true);
      });
      
      // 验证fs.unlinkSync被调用的次数
      expect(fs.unlinkSync).toHaveBeenCalledTimes(3);
    });
  });
}); 