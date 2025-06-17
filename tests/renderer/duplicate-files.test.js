/**
 * 渲染进程重复文件功能测试
 * 测试重复文件查找、显示和操作相关功能
 */

// 模拟DOM环境
document.body.innerHTML = `
  <div id="duplicate-files-tab" class="content-tab">
    <div class="duplicate-search-controls">
      <div class="path-selection">
        <label for="search-path">搜索位置:</label>
        <select id="search-path">
          <option value="documents">文档</option>
          <option value="downloads">下载</option>
          <option value="desktop">桌面</option>
          <option value="pictures">图片</option>
          <option value="videos">视频</option>
          <option value="music">音乐</option>
          <option value="custom">自定义位置...</option>
        </select>
      </div>
      <button id="find-duplicates-btn">查找重复文件</button>
    </div>
    
    <div id="duplicate-placeholder" class="scan-placeholder">
      <div class="placeholder-icon"><i class="fas fa-copy"></i></div>
      <h3>查找重复文件</h3>
      <p>选择要扫描的文件夹并点击"查找重复文件"按钮</p>
    </div>
    
    <div id="duplicate-scanning" class="scanning-status" style="display: none;">
      <div class="spinner"></div>
      <h3>正在扫描文件系统...</h3>
      <div id="scan-details">已扫描 <span id="scanned-files-count">0</span> 个文件</div>
    </div>
    
    <div id="duplicate-results" class="scan-results" style="display: none;">
      <div class="duplicate-summary">
        <div>共扫描 <span id="total-scanned-files">0</span> 个文件，找到 <span id="duplicate-groups-count">0</span> 组重复文件</div>
        <div>可释放空间： <span id="potential-space-saved">0 MB</span></div>
      </div>
      <div class="duplicate-actions">
        <button id="select-all-duplicates">全选</button>
        <button id="deselect-all-duplicates">取消全选</button>
        <button id="delete-selected-duplicates">删除所选文件</button>
      </div>
      <div id="duplicate-groups" class="duplicate-groups">
        <!-- 重复文件组将在这里动态生成 -->
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

// 模拟对话框
const mockDialog = {
  showOpenDialog: jest.fn().mockResolvedValue({ filePaths: ['C:\\Users\\Test\\Custom'], canceled: false })
};

// 全局函数模拟
global.openFileLocation = jest.fn();
global.deleteSingleFile = jest.fn();
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

// 在测试前导入和设置环境
beforeEach(() => {
  // 重置所有模拟函数
  jest.clearAllMocks();
  
  // 模拟electron
  window.ipcRenderer = mockIpcRenderer;
  window.electron = { dialog: mockDialog };
});

describe('渲染进程重复文件功能测试', () => {
  describe('重复文件查找功能', () => {
    test('点击查找按钮应调用IPC并显示扫描状态', async () => {
      // 模拟选择搜索路径
      const searchPathSelect = document.getElementById('search-path');
      searchPathSelect.value = 'documents';
      
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 获取DOM元素
      const findButton = document.getElementById('find-duplicates-btn');
      const placeholder = document.getElementById('duplicate-placeholder');
      const scanningStatus = document.getElementById('duplicate-scanning');
      
      // 创建一个成功的响应
      const mockSuccess = {
        success: true,
        duplicateGroups: [
          {
            hash: 'abc123',
            files: [
              { path: 'C:\\Users\\Test\\Documents\\file1.txt', size: 1024, lastModified: new Date().toISOString() },
              { path: 'C:\\Users\\Test\\Documents\\Backup\\file1.txt', size: 1024, lastModified: new Date().toISOString() }
            ]
          },
          {
            hash: 'def456',
            files: [
              { path: 'C:\\Users\\Test\\Documents\\image1.jpg', size: 1024 * 1024, lastModified: new Date().toISOString() },
              { path: 'C:\\Users\\Test\\Documents\\Photos\\image1.jpg', size: 1024 * 1024, lastModified: new Date().toISOString() }
            ]
          }
        ],
        totalFiles: 100,
        totalDuplicates: 4,
        searchPath: 'C:\\Users\\Test\\Documents'
      };
      
      // 模拟IPC调用返回结果
      mockIpcRenderer.invoke.mockResolvedValue(mockSuccess);
      
      // 模拟点击查找按钮
      const clickHandler = findButton.addEventListener.mock.calls[0][1];
      await clickHandler();
      
      // 验证UI状态变化
      expect(placeholder.style.display).toBe('none');
      expect(scanningStatus.style.display).toBe('flex');
      
      // 验证IPC调用
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('find-duplicate-files', 'documents');
      
      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // 验证结果显示
      const resultsContainer = document.getElementById('duplicate-results');
      expect(resultsContainer.style.display).toBe('block');
      
      // 验证统计数据显示
      const totalScannedElement = document.getElementById('total-scanned-files');
      const duplicateGroupsElement = document.getElementById('duplicate-groups-count');
      
      expect(totalScannedElement.textContent).toBe('100');
      expect(duplicateGroupsElement.textContent).toBe('2');
    });
    
    test('应处理自定义路径选择', async () => {
      // 模拟选择自定义路径
      const searchPathSelect = document.getElementById('search-path');
      searchPathSelect.value = 'custom';
      
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 获取查找按钮
      const findButton = document.getElementById('find-duplicates-btn');
      
      // 模拟IPC成功返回
      mockIpcRenderer.invoke.mockResolvedValue({
        success: true,
        duplicateGroups: [],
        totalFiles: 50,
        totalDuplicates: 0,
        searchPath: 'C:\\Users\\Test\\Custom'
      });
      
      // 模拟点击查找按钮
      const clickHandler = findButton.addEventListener.mock.calls[0][1];
      await clickHandler();
      
      // 验证对话框被调用
      expect(mockDialog.showOpenDialog).toHaveBeenCalled();
      
      // 验证IPC调用
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('find-duplicate-files', 'custom:C:\\Users\\Test\\Custom');
    });
    
    test('处理搜索错误', async () => {
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 获取查找按钮
      const findButton = document.getElementById('find-duplicates-btn');
      
      // 模拟IPC返回错误
      mockIpcRenderer.invoke.mockResolvedValue({
        success: false,
        error: '指定的路径不存在'
      });
      
      // 模拟点击查找按钮
      const clickHandler = findButton.addEventListener.mock.calls[0][1];
      await clickHandler();
      
      // 验证错误提示
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('指定的路径不存在'));
      
      // 验证UI恢复初始状态
      const placeholder = document.getElementById('duplicate-placeholder');
      const scanningStatus = document.getElementById('duplicate-scanning');
      
      expect(placeholder.style.display).toBe('flex');
      expect(scanningStatus.style.display).toBe('none');
    });
  });
  
  describe('重复文件显示功能', () => {
    test('应正确显示重复文件组', () => {
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟重复文件数据
      const mockResult = {
        success: true,
        duplicateGroups: [
          {
            hash: 'abc123',
            files: [
              { path: 'C:\\Users\\Test\\Documents\\file1.txt', size: 1024, lastModified: new Date().toISOString() },
              { path: 'C:\\Users\\Test\\Documents\\Backup\\file1.txt', size: 1024, lastModified: new Date().toISOString() }
            ]
          }
        ],
        totalFiles: 100,
        totalDuplicates: 2,
        searchPath: 'C:\\Users\\Test\\Documents',
        potentialSavings: 1024 // 1KB
      };
      
      // 调用显示重复文件结果函数
      renderer.showDuplicateFilesResults(mockResult);
      
      // 获取重复文件组容器
      const duplicateGroups = document.getElementById('duplicate-groups');
      
      // 验证重复文件组显示
      expect(duplicateGroups.children.length).toBe(1);
      
      // 验证文件显示
      const duplicateGroup = duplicateGroups.children[0];
      const groupTitle = duplicateGroup.querySelector('.group-title');
      expect(groupTitle.textContent).toContain('.txt');
      
      // 验证文件列表
      const fileList = duplicateGroup.querySelector('.duplicate-file-list');
      expect(fileList.children.length).toBe(2);
    });
    
    test('无重复文件时应显示提示消息', () => {
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟无重复文件的结果
      const mockResult = {
        success: true,
        duplicateGroups: [],
        totalFiles: 100,
        totalDuplicates: 0,
        searchPath: 'C:\\Users\\Test\\Documents',
        potentialSavings: 0
      };
      
      // 调用显示重复文件结果函数
      renderer.showDuplicateFilesResults(mockResult);
      
      // 获取重复文件组容器
      const duplicateGroups = document.getElementById('duplicate-groups');
      
      // 验证显示无重复文件消息
      expect(duplicateGroups.innerHTML).toContain('未找到重复文件');
    });
  });
  
  describe('重复文件选择与删除功能', () => {
    test('全选按钮应选中所有文件', () => {
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟重复文件数据并显示
      const mockResult = {
        success: true,
        duplicateGroups: [
          {
            hash: 'abc123',
            files: [
              { path: 'C:\\Users\\Test\\Documents\\file1.txt', size: 1024, lastModified: new Date().toISOString() },
              { path: 'C:\\Users\\Test\\Documents\\Backup\\file1.txt', size: 1024, lastModified: new Date().toISOString() }
            ]
          }
        ],
        totalFiles: 100,
        totalDuplicates: 2,
        searchPath: 'C:\\Users\\Test\\Documents',
        potentialSavings: 1024
      };
      
      // 显示重复文件结果
      renderer.showDuplicateFilesResults(mockResult);
      
      // 获取全选按钮和复选框
      const selectAllBtn = document.getElementById('select-all-duplicates');
      const checkboxes = document.querySelectorAll('.duplicate-file input[type="checkbox"]');
      
      // 确保有复选框
      expect(checkboxes.length).toBe(2);
      
      // 模拟点击全选按钮
      selectAllBtn.click();
      
      // 验证所有复选框被选中
      checkboxes.forEach(checkbox => {
        expect(checkbox.checked).toBe(true);
      });
    });
    
    test('取消全选按钮应取消所有选择', () => {
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟重复文件数据并显示
      const mockResult = {
        success: true,
        duplicateGroups: [
          {
            hash: 'abc123',
            files: [
              { path: 'C:\\Users\\Test\\Documents\\file1.txt', size: 1024, lastModified: new Date().toISOString() },
              { path: 'C:\\Users\\Test\\Documents\\Backup\\file1.txt', size: 1024, lastModified: new Date().toISOString() }
            ]
          }
        ],
        totalFiles: 100,
        totalDuplicates: 2,
        searchPath: 'C:\\Users\\Test\\Documents',
        potentialSavings: 1024
      };
      
      // 显示重复文件结果
      renderer.showDuplicateFilesResults(mockResult);
      
      // 获取取消全选按钮和复选框
      const deselectAllBtn = document.getElementById('deselect-all-duplicates');
      const checkboxes = document.querySelectorAll('.duplicate-file input[type="checkbox"]');
      
      // 先选中所有复选框
      checkboxes.forEach(checkbox => {
        checkbox.checked = true;
      });
      
      // 模拟点击取消全选按钮
      deselectAllBtn.click();
      
      // 验证所有复选框被取消选中
      checkboxes.forEach(checkbox => {
        expect(checkbox.checked).toBe(false);
      });
    });
    
    test('删除所选文件按钮应调用IPC删除功能', async () => {
      // 模拟用户确认
      window.confirm.mockReturnValue(true);
      
      // 模拟IPC删除成功返回
      mockIpcRenderer.invoke.mockResolvedValue([
        { path: 'C:\\Users\\Test\\Documents\\Backup\\file1.txt', success: true }
      ]);
      
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟重复文件数据并显示
      const mockResult = {
        success: true,
        duplicateGroups: [
          {
            hash: 'abc123',
            files: [
              { path: 'C:\\Users\\Test\\Documents\\file1.txt', size: 1024, lastModified: new Date().toISOString() },
              { path: 'C:\\Users\\Test\\Documents\\Backup\\file1.txt', size: 1024, lastModified: new Date().toISOString() }
            ]
          }
        ],
        totalFiles: 100,
        totalDuplicates: 2,
        searchPath: 'C:\\Users\\Test\\Documents',
        potentialSavings: 1024
      };
      
      // 显示重复文件结果
      renderer.showDuplicateFilesResults(mockResult);
      
      // 获取删除按钮和复选框
      const deleteSelectedBtn = document.getElementById('delete-selected-duplicates');
      const checkboxes = document.querySelectorAll('.duplicate-file input[type="checkbox"]');
      
      // 选中第二个复选框
      checkboxes[1].checked = true;
      
      // 模拟点击删除按钮
      const deleteHandler = deleteSelectedBtn.addEventListener.mock.calls[0][1];
      await deleteHandler();
      
      // 验证确认对话框显示
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('确定要删除'));
      
      // 验证IPC调用
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'delete-duplicate-files',
        [{ path: 'C:\\Users\\Test\\Documents\\Backup\\file1.txt' }]
      );
      
      // 验证成功提示
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('成功删除'));
    });
    
    test('文件操作功能集成测试', () => {
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟重复文件数据并显示
      const mockResult = {
        success: true,
        duplicateGroups: [
          {
            hash: 'abc123',
            files: [
              { path: 'C:\\Users\\Test\\Documents\\file1.txt', size: 1024, lastModified: new Date().toISOString() }
            ]
          }
        ],
        totalFiles: 100,
        totalDuplicates: 1,
        searchPath: 'C:\\Users\\Test\\Documents',
        potentialSavings: 0
      };
      
      // 显示重复文件结果
      renderer.showDuplicateFilesResults(mockResult);
      
      // 测试打开文件位置功能
      const openLocationBtn = document.querySelector('.file-action[data-action="open-location"]');
      openLocationBtn.click();
      
      // 验证openFileLocation被调用
      expect(global.openFileLocation).toHaveBeenCalledWith('C:\\Users\\Test\\Documents\\file1.txt');
    });
  });
}); 