/**
 * 渲染进程大文件功能测试
 * 测试大文件查找、显示和操作相关功能
 */

// 模拟DOM环境
document.body.innerHTML = `
  <div id="large-files-tab" class="content-tab">
    <div class="large-files-controls">
      <div class="search-controls">
        <div class="size-filter">
          <label for="min-file-size">最小文件大小:</label>
          <select id="min-file-size">
            <option value="100">100 MB</option>
            <option value="500">500 MB</option>
            <option value="1000">1 GB</option>
          </select>
        </div>
        <button id="find-large-files-btn">查找大文件</button>
      </div>
    </div>
    
    <div id="large-files-placeholder" class="scan-placeholder">
      <div class="placeholder-icon"><i class="fas fa-search"></i></div>
      <h3>查找占用空间大的文件</h3>
      <p>选择最小文件大小并点击"查找大文件"按钮</p>
    </div>
    
    <div id="large-files-scanning" class="scanning-status" style="display: none;">
      <div class="spinner"></div>
      <h3>正在扫描文件系统...</h3>
      <div class="progress-bar">
        <div id="large-files-progress" class="progress" style="width: 0%"></div>
      </div>
    </div>
    
    <div id="large-files-results" class="large-files-results" style="display: none;">
      <div class="large-files-toolbar">
        <div class="files-count">找到 <span id="large-files-count">0</span> 个大文件</div>
      </div>
      <div class="file-list-container">
        <table id="large-files-list" class="file-list">
          <thead>
            <tr>
              <th width="40%">文件名</th>
              <th width="40%">位置</th>
              <th width="10%">大小</th>
              <th width="10%">操作</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
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

// 模拟Chart.js
jest.mock('chart.js', () => ({
  Chart: jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    destroy: jest.fn()
  }))
}));

// 全局变量和函数模拟
global.openFileLocation = jest.fn();
global.deleteSingleFile = jest.fn();
global.refreshLargeFilesList = jest.fn();

// 在测试前导入和设置环境
beforeEach(() => {
  // 重置所有模拟函数
  jest.clearAllMocks();
  
  // 模拟ipcRenderer
  window.ipcRenderer = mockIpcRenderer;
});

describe('渲染进程大文件功能测试', () => {
  describe('大文件查找功能', () => {
    test('点击查找按钮应调用IPC并显示扫描状态', async () => {
      // 模拟选择最小文件大小
      const minFileSizeSelect = document.getElementById('min-file-size');
      minFileSizeSelect.value = '500';  // 设置为500MB
      
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 获取DOM元素
      const findButton = document.getElementById('find-large-files-btn');
      const placeholder = document.getElementById('large-files-placeholder');
      const scanningStatus = document.getElementById('large-files-scanning');
      
      // 模拟IPC调用返回结果
      mockIpcRenderer.invoke.mockResolvedValue([
        {
          path: 'C:\\Users\\Test\\Videos\\movie.mp4',
          size: 1024 * 1024 * 1024 * 2, // 2GB
          lastModified: new Date().toISOString()
        },
        {
          path: 'C:\\Users\\Test\\Downloads\\installer.exe',
          size: 1024 * 1024 * 700, // 700MB
          lastModified: new Date().toISOString()
        }
      ]);
      
      // 模拟点击查找按钮
      const clickHandler = findButton.addEventListener.mock.calls[0][1];
      await clickHandler();
      
      // 验证UI状态变化
      expect(placeholder.style.display).toBe('none');
      expect(scanningStatus.style.display).toBe('flex');
      
      // 验证IPC调用
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-large-files', '500');
      
      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // 验证结果显示
      const resultsContainer = document.getElementById('large-files-results');
      expect(resultsContainer.style.display).toBe('block');
      
      // 验证文件计数
      const fileCountElement = document.getElementById('large-files-count');
      expect(fileCountElement.textContent).toBe('2');
    });
    
    test('处理IPC返回错误情况', async () => {
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 获取DOM元素
      const findButton = document.getElementById('find-large-files-btn');
      
      // 模拟IPC调用抛出错误
      mockIpcRenderer.invoke.mockRejectedValue(new Error('扫描错误'));
      
      // 模拟点击查找按钮
      const clickHandler = findButton.addEventListener.mock.calls[0][1];
      await clickHandler();
      
      // 验证错误处理
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('扫描错误'));
      
      // 验证UI恢复到初始状态
      const placeholder = document.getElementById('large-files-placeholder');
      const scanningStatus = document.getElementById('large-files-scanning');
      
      expect(placeholder.style.display).toBe('flex');
      expect(scanningStatus.style.display).toBe('none');
    });
  });
  
  describe('大文件显示功能', () => {
    test('应正确显示大文件列表', () => {
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟文件数据
      const mockFiles = [
        {
          path: 'C:\\Users\\Test\\Videos\\movie.mp4',
          size: 1024 * 1024 * 1024 * 2, // 2GB
          lastModified: new Date().toISOString()
        },
        {
          path: 'C:\\Users\\Test\\Downloads\\installer.exe',
          size: 1024 * 1024 * 700, // 700MB
          lastModified: new Date().toISOString()
        }
      ];
      
      // 调用显示大文件结果函数
      renderer.showLargeFilesResults(mockFiles);
      
      // 获取文件列表表格
      const fileListTable = document.getElementById('large-files-list');
      const tableRows = fileListTable.querySelectorAll('tbody tr');
      
      // 验证表格行数
      expect(tableRows.length).toBe(2);
      
      // 验证文件大小格式化
      const firstRowSizeCell = tableRows[0].cells[2];
      expect(firstRowSizeCell.textContent).toContain('2 GB');
      
      // 验证文件名显示
      const firstRowNameCell = tableRows[0].cells[0];
      expect(firstRowNameCell.textContent).toContain('movie.mp4');
      
      // 验证文件路径显示
      const firstRowPathCell = tableRows[0].cells[1];
      expect(firstRowPathCell.textContent).toContain('C:\\Users\\Test\\Videos');
    });
    
    test('空结果应显示无文件消息', () => {
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 调用显示大文件结果函数，传入空数组
      renderer.showLargeFilesResults([]);
      
      // 获取文件列表表格
      const fileListTable = document.getElementById('large-files-list');
      const tableBody = fileListTable.querySelector('tbody');
      
      // 验证表格内容
      expect(tableBody.innerHTML).toContain('未找到符合条件的大文件');
    });
  });
  
  describe('文件操作功能集成测试', () => {
    test('点击打开位置按钮应调用openFileLocation函数', () => {
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟文件数据并显示
      const mockFiles = [
        {
          path: 'C:\\Users\\Test\\Videos\\movie.mp4',
          size: 1024 * 1024 * 1024 * 2,
          lastModified: new Date().toISOString()
        }
      ];
      
      // 显示文件列表
      renderer.showLargeFilesResults(mockFiles);
      
      // 获取打开位置按钮
      const openLocationBtn = document.querySelector('.file-action[data-action="open-location"]');
      
      // 模拟点击按钮
      openLocationBtn.click();
      
      // 验证函数调用
      expect(global.openFileLocation).toHaveBeenCalledWith('C:\\Users\\Test\\Videos\\movie.mp4');
    });
    
    test('点击删除按钮应调用deleteSingleFile函数', () => {
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟文件数据并显示
      const mockFiles = [
        {
          path: 'C:\\Users\\Test\\Videos\\movie.mp4',
          size: 1024 * 1024 * 1024 * 2,
          lastModified: new Date().toISOString()
        }
      ];
      
      // 显示文件列表
      renderer.showLargeFilesResults(mockFiles);
      
      // 获取删除按钮
      const deleteBtn = document.querySelector('.file-action[data-action="delete"]');
      
      // 模拟点击按钮
      deleteBtn.click();
      
      // 验证函数调用
      expect(global.deleteSingleFile).toHaveBeenCalledWith('C:\\Users\\Test\\Videos\\movie.mp4');
    });
  });
}); 