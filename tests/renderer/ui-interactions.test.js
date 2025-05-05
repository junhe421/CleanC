/**
 * 渲染进程 UI 交互功能测试
 * 注意: 这些测试需要在一个模拟的DOM环境中运行
 */

// 在测试环境中模拟DOM和浏览器API
const setupDomMock = () => {
  // 创建模拟的HTML元素
  const mockElements = {};
  
  // 模拟document.getElementById
  document.getElementById = jest.fn(id => {
    if (!mockElements[id]) {
      mockElements[id] = {
        id,
        style: {},
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn().mockReturnValue(false)
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn().mockReturnValue([]),
        appendChild: jest.fn(),
        innerHTML: '',
        value: '',
        checked: false,
        click: jest.fn()
      };
    }
    return mockElements[id];
  });
  
  // 模拟document.createElement
  document.createElement = jest.fn(tag => ({
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    },
    dataset: {},
    addEventListener: jest.fn(),
    appendChild: jest.fn(),
    querySelectorAll: jest.fn().mockReturnValue([]),
    querySelector: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    innerHTML: ''
  }));
  
  // 模拟document.querySelectorAll
  document.querySelectorAll = jest.fn().mockReturnValue([]);
  
  // 模拟window.addEventListener
  window.addEventListener = jest.fn();
  
  // 模拟alert, confirm等
  window.alert = jest.fn();
  window.confirm = jest.fn().mockReturnValue(true);
  
  return mockElements;
};

// 模拟electron的ipcRenderer
const mockIpcRenderer = {
  invoke: jest.fn().mockResolvedValue({}),
  on: jest.fn(),
  send: jest.fn()
};

// 模拟Chart.js
jest.mock('chart.js', () => ({
  Chart: jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    destroy: jest.fn()
  }))
}));

describe('渲染进程UI交互测试', () => {
  let mockElements;
  
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    // 设置DOM模拟
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    mockElements = setupDomMock();
    
    // 模拟electron的ipcRenderer
    jest.mock('electron', () => ({
      ipcRenderer: mockIpcRenderer
    }));
    
    // 重置模拟函数
    mockIpcRenderer.invoke.mockReset();
    mockIpcRenderer.invoke.mockResolvedValue({});
  });
  
  describe('导航功能测试', () => {
    test('点击导航项应该切换活动标签页', () => {
      // 模拟DOM元素
      const navItems = Array(5).fill().map((_, i) => ({
        dataset: { tab: `tab-${i}` },
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn().mockImplementation(cls => cls === 'active' && i === 0)
        },
        addEventListener: jest.fn()
      }));
      
      const contentTabs = Array(5).fill().map((_, i) => ({
        id: `tab-${i}`,
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn().mockImplementation(cls => cls === 'active' && i === 0)
        }
      }));
      
      document.querySelectorAll = jest.fn().mockImplementation(selector => {
        if (selector === '.nav-item') return navItems;
        if (selector === '.content-tab') return contentTabs;
        return [];
      });
      
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟点击第二个导航项
      const clickEvent = { target: navItems[1] };
      const clickHandler = navItems[1].addEventListener.mock.calls[0][1];
      clickHandler(clickEvent);
      
      // 验证类被正确添加和移除
      expect(navItems[0].classList.remove).toHaveBeenCalledWith('active');
      expect(navItems[1].classList.add).toHaveBeenCalledWith('active');
      expect(contentTabs[0].classList.remove).toHaveBeenCalledWith('active');
      expect(contentTabs[1].classList.add).toHaveBeenCalledWith('active');
    });
  });
  
  describe('磁盘信息功能测试', () => {
    test('加载磁盘信息应该调用IPC并更新UI', async () => {
      // 模拟IPC返回磁盘信息
      mockIpcRenderer.invoke.mockResolvedValueOnce([{
        mounted: 'C:',
        blocks: 1024 * 1024 * 1024 * 250, // 250GB
        used: 1024 * 1024 * 1024 * 120,   // 120GB
        available: 1024 * 1024 * 1024 * 130, // 130GB
        capacity: '48%'
      }]);
      
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 验证IPC被调用
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-disk-info');
      
      // 模拟等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // 验证UI元素是否被更新
      expect(mockElements['total-space']).toBeDefined();
      expect(mockElements['used-space']).toBeDefined();
      expect(mockElements['free-space']).toBeDefined();
    });
  });
  
  describe('快速清理功能测试', () => {
    test('开始扫描应该显示扫描状态并调用IPC', async () => {
      // 模拟DOM元素
      const scanPlaceholder = mockElements['scan-placeholder'];
      const scanningStatus = mockElements['scanning-status'];
      const scanProgress = mockElements['scan-progress'];
      
      // 模拟IPC返回扫描结果
      mockIpcRenderer.invoke.mockResolvedValueOnce([
        { path: 'C:\\Windows\\Temp', size: 1024 * 1024 * 50, safeToDelete: true },
        { path: 'C:\\Users\\Test\\AppData\\Local\\Temp', size: 1024 * 1024 * 100, safeToDelete: true }
      ]);
      
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟点击"开始扫描"按钮
      const startScanBtn = mockElements['start-quick-scan-btn'];
      const clickHandler = startScanBtn.addEventListener.mock.calls[0][1];
      await clickHandler();
      
      // 验证UI显示状态
      expect(scanPlaceholder.style.display).toBe('none');
      expect(scanningStatus.style.display).toBe('flex');
      
      // 验证IPC被调用
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('scan-temp-files');
      
      // 模拟等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // 验证扫描结果UI是否显示
      expect(mockElements['quick-clean-results']).toBeDefined();
      expect(mockElements['total-junk-size']).toBeDefined();
      expect(mockElements['junk-file-count']).toBeDefined();
    });
  });
  
  describe('重复文件查找功能测试', () => {
    test('点击查找按钮应调用IPC并处理结果', async () => {
      // 模拟搜索路径选择元素
      const searchPath = mockElements['search-path'];
      searchPath.value = 'documents';
      
      // 模拟IPC返回重复文件结果
      mockIpcRenderer.invoke.mockResolvedValueOnce({
        success: true,
        duplicateGroups: [
          {
            hash: 'abc123',
            files: [
              { path: 'C:\\Users\\Test\\Documents\\file1.txt', size: 1024, lastModified: new Date() },
              { path: 'C:\\Users\\Test\\Documents\\file2.txt', size: 1024, lastModified: new Date() }
            ]
          }
        ],
        totalFiles: 100,
        totalDuplicates: 2,
        searchPath: 'C:\\Users\\Test\\Documents'
      });
      
      // 加载渲染进程模块
      const renderer = require('../../src/js/renderer.js');
      
      // 模拟点击"查找重复文件"按钮
      const findDuplicatesBtn = mockElements['find-duplicates-btn'];
      const clickHandler = findDuplicatesBtn.addEventListener.mock.calls[0][1];
      await clickHandler();
      
      // 验证IPC被调用
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('find-duplicate-files', searchPath.value);
      
      // 模拟等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // 验证结果是否显示
      expect(mockElements['duplicate-results']).toBeDefined();
      expect(mockElements['duplicate-placeholder'].style.display).toBe('none');
    });
  });
}); 