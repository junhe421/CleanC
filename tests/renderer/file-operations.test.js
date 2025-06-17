/**
 * 渲染进程文件操作功能测试
 * 测试渲染器进程中的打开文件位置和删除单个文件的功能
 */

// 模拟DOM环境
document.body.innerHTML = `
  <div id="file-list">
    <div class="file-item" data-path="C:\\Users\\Test\\Documents\\testfile.txt">
      <span class="file-name">testfile.txt</span>
      <div class="file-actions">
        <button class="open-location-btn">打开位置</button>
        <button class="delete-file-btn">删除文件</button>
      </div>
    </div>
    <div class="file-item" data-path="C:\\Users\\Test\\Documents\\test&quot;file&quot;.txt">
      <span class="file-name">test"file".txt</span>
      <div class="file-actions">
        <button class="open-location-btn">打开位置</button>
        <button class="delete-file-btn">删除文件</button>
      </div>
    </div>
  </div>
`;

// 模拟electron的ipcRenderer
const mockIpcRenderer = {
  invoke: jest.fn()
};

// 模拟window对象方法
window.alert = jest.fn();
window.confirm = jest.fn();

// 全局函数模拟
global.refreshFileList = jest.fn();
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

// 在测试前导入和设置环境
beforeEach(() => {
  // 重置所有模拟函数
  jest.clearAllMocks();
  
  // 模拟ipcRenderer
  window.ipcRenderer = mockIpcRenderer;
  
  // 导入渲染器脚本
  require('../../src/js/renderer.js');
});

describe('渲染进程文件操作测试', () => {
  describe('打开文件位置功能', () => {
    test('成功打开有效文件的位置', async () => {
      // 模拟IPC调用成功返回
      mockIpcRenderer.invoke.mockResolvedValue({ success: true });
      
      // 获取文件路径
      const filePath = 'C:\\Users\\Test\\Documents\\testfile.txt';
      
      // 调用打开文件位置函数
      await openFileLocation(filePath);
      
      // 验证IPC调用
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('open-file-location', filePath);
      
      // 验证没有显示错误提示
      expect(window.alert).not.toHaveBeenCalled();
      
      // 验证控制台记录
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('正在打开文件位置'));
    });
    
    test('处理HTML转义的文件路径', async () => {
      // 模拟IPC调用成功返回
      mockIpcRenderer.invoke.mockResolvedValue({ success: true });
      
      // 获取带HTML转义的文件路径
      const escapedFilePath = 'C:\\Users\\Test\\Documents\\test&quot;file&quot;.txt';
      const unescapedFilePath = 'C:\\Users\\Test\\Documents\\test"file".txt';
      
      // 调用打开文件位置函数
      await openFileLocation(escapedFilePath);
      
      // 验证IPC调用使用了未转义的路径
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('open-file-location', unescapedFilePath);
    });
    
    test('处理打开文件位置失败的情况', async () => {
      // 模拟IPC调用失败返回
      const errorMessage = '文件不存在';
      mockIpcRenderer.invoke.mockResolvedValue({ success: false, error: errorMessage });
      
      // 获取文件路径
      const filePath = 'C:\\Users\\Test\\Documents\\testfile.txt';
      
      // 调用打开文件位置函数
      await openFileLocation(filePath);
      
      // 验证显示了错误提示
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
      
      // 验证控制台记录了错误
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('打开文件位置失败'));
    });
    
    test('处理IPC通信错误', async () => {
      // 模拟IPC调用抛出异常
      const errorMessage = 'IPC通信错误';
      mockIpcRenderer.invoke.mockRejectedValue(new Error(errorMessage));
      
      // 获取文件路径
      const filePath = 'C:\\Users\\Test\\Documents\\testfile.txt';
      
      // 调用打开文件位置函数
      await openFileLocation(filePath);
      
      // 验证显示了错误提示
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('打开文件位置失败'));
      
      // 验证控制台记录了错误
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('打开文件位置失败'));
    });
    
    test('测试打开文件位置按钮点击事件', () => {
      // 创建间谍函数代替全局函数
      global.openFileLocation = jest.fn();
      
      // 获取按钮并模拟点击
      const openButtons = document.querySelectorAll('.open-location-btn');
      openButtons[0].click();
      
      // 验证函数调用
      expect(global.openFileLocation).toHaveBeenCalledWith('C:\\Users\\Test\\Documents\\testfile.txt');
    });
  });
  
  describe('删除单个文件功能', () => {
    test('用户确认后成功删除文件', async () => {
      // 模拟用户确认
      window.confirm.mockReturnValue(true);
      
      // 模拟IPC调用成功返回
      mockIpcRenderer.invoke.mockResolvedValue([
        { 
          filePath: 'C:\\Users\\Test\\Documents\\testfile.txt',
          success: true
        }
      ]);
      
      // 获取文件路径
      const filePath = 'C:\\Users\\Test\\Documents\\testfile.txt';
      
      // 调用删除文件函数
      await deleteSingleFile(filePath);
      
      // 验证用户确认对话框显示
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('确定要删除'));
      
      // 验证IPC调用
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('delete-large-files', [filePath]);
      
      // 验证刷新文件列表被调用
      expect(global.refreshFileList).toHaveBeenCalled();
      
      // 验证没有显示错误提示
      expect(window.alert).not.toHaveBeenCalled();
    });
    
    test('用户取消删除操作', async () => {
      // 模拟用户取消确认
      window.confirm.mockReturnValue(false);
      
      // 获取文件路径
      const filePath = 'C:\\Users\\Test\\Documents\\testfile.txt';
      
      // 调用删除文件函数
      await deleteSingleFile(filePath);
      
      // 验证用户确认对话框显示
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('确定要删除'));
      
      // 验证IPC调用没有执行
      expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
      
      // 验证刷新文件列表没有被调用
      expect(global.refreshFileList).not.toHaveBeenCalled();
    });
    
    test('处理HTML转义的文件路径', async () => {
      // 模拟用户确认
      window.confirm.mockReturnValue(true);
      
      // 模拟IPC调用成功返回
      mockIpcRenderer.invoke.mockResolvedValue([
        { 
          filePath: 'C:\\Users\\Test\\Documents\\test"file".txt',
          success: true
        }
      ]);
      
      // 获取带HTML转义的文件路径
      const escapedFilePath = 'C:\\Users\\Test\\Documents\\test&quot;file&quot;.txt';
      const unescapedFilePath = 'C:\\Users\\Test\\Documents\\test"file".txt';
      
      // 调用删除文件函数
      await deleteSingleFile(escapedFilePath);
      
      // 验证IPC调用使用了未转义的路径
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('delete-large-files', [unescapedFilePath]);
    });
    
    test('处理删除文件失败的情况', async () => {
      // 模拟用户确认
      window.confirm.mockReturnValue(true);
      
      // 模拟IPC调用返回失败
      const errorMessage = '权限不足';
      mockIpcRenderer.invoke.mockResolvedValue([
        { 
          filePath: 'C:\\Users\\Test\\Documents\\testfile.txt',
          success: false,
          error: errorMessage
        }
      ]);
      
      // 获取文件路径
      const filePath = 'C:\\Users\\Test\\Documents\\testfile.txt';
      
      // 调用删除文件函数
      await deleteSingleFile(filePath);
      
      // 验证显示了错误提示
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
      
      // 验证控制台记录了错误
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('删除文件失败'));
      
      // 验证刷新文件列表没有被调用
      expect(global.refreshFileList).not.toHaveBeenCalled();
    });
    
    test('处理IPC通信错误', async () => {
      // 模拟用户确认
      window.confirm.mockReturnValue(true);
      
      // 模拟IPC调用抛出异常
      const errorMessage = 'IPC通信错误';
      mockIpcRenderer.invoke.mockRejectedValue(new Error(errorMessage));
      
      // 获取文件路径
      const filePath = 'C:\\Users\\Test\\Documents\\testfile.txt';
      
      // 调用删除文件函数
      await deleteSingleFile(filePath);
      
      // 验证显示了错误提示
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('删除文件失败'));
      
      // 验证控制台记录了错误
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('删除文件失败'));
      
      // 验证刷新文件列表没有被调用
      expect(global.refreshFileList).not.toHaveBeenCalled();
    });
    
    test('测试删除文件按钮点击事件', () => {
      // 创建间谍函数代替全局函数
      global.deleteSingleFile = jest.fn();
      
      // 获取按钮并模拟点击
      const deleteButtons = document.querySelectorAll('.delete-file-btn');
      deleteButtons[0].click();
      
      // 验证函数调用
      expect(global.deleteSingleFile).toHaveBeenCalledWith('C:\\Users\\Test\\Documents\\testfile.txt');
    });
  });
}); 