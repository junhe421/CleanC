/**
 * Electron模拟文件
 * 用于在测试环境中模拟Electron的核心功能
 */

// 创建电子对象的模拟实现
const electron = {
  // 主进程模块
  app: {
    getPath: jest.fn((name) => {
      if (name === 'userData') return '/mock/user/data/path';
      if (name === 'temp') return '/mock/temp/path';
      if (name === 'desktop') return '/mock/desktop/path';
      if (name === 'documents') return '/mock/documents/path';
      if (name === 'downloads') return '/mock/downloads/path';
      if (name === 'music') return '/mock/music/path';
      if (name === 'pictures') return '/mock/pictures/path';
      if (name === 'videos') return '/mock/videos/path';
      return '/mock/unknown/path';
    }),
    getAppPath: jest.fn().mockReturnValue('/mock/app/path'),
    quit: jest.fn(),
    on: jest.fn(),
    whenReady: jest.fn().mockResolvedValue(undefined),
    getName: jest.fn().mockReturnValue('CleanC'),
    getVersion: jest.fn().mockReturnValue('1.0.0')
  },
  
  // BrowserWindow模拟
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    webContents: {
      on: jest.fn(),
      send: jest.fn(),
      openDevTools: jest.fn()
    },
    on: jest.fn(),
    maximize: jest.fn(),
    show: jest.fn(),
    close: jest.fn(),
    destroy: jest.fn()
  })),
  
  // 对话框模拟
  dialog: {
    showOpenDialog: jest.fn().mockResolvedValue({ canceled: false, filePaths: ['/mock/selected/path'] }),
    showMessageBox: jest.fn().mockResolvedValue({ response: 0 }),
    showErrorBox: jest.fn()
  },
  
  // Shell模拟
  shell: {
    openExternal: jest.fn().mockResolvedValue(undefined),
    showItemInFolder: jest.fn().mockReturnValue(undefined),
    openPath: jest.fn().mockResolvedValue('')
  },
  
  // IPC主进程模拟
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeHandler: jest.fn(),
    removeAllListeners: jest.fn()
  },
  
  // IPC渲染进程模拟
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    send: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn()
  },
  
  // Clipboard模拟
  clipboard: {
    writeText: jest.fn(),
    readText: jest.fn().mockReturnValue('')
  },
  
  // nativeTheme模拟
  nativeTheme: {
    shouldUseDarkColors: false,
    themeSource: 'system',
    on: jest.fn()
  }
};

// 创建一个代理以处理未模拟的属性
module.exports = new Proxy(electron, {
  get: function(target, property) {
    if (property in target) {
      return target[property];
    }
    
    console.warn(`⚠️ 属性 "${property}" 在Electron模拟中不存在!`);
    return jest.fn();
  }
}); 