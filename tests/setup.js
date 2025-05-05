// 全局测试设置文件

// 模拟electron的ipcMain和ipcRenderer
jest.mock('electron', () => {
  const mockIpcMain = {
    handle: jest.fn(),
    on: jest.fn()
  };
  
  const mockIpcRenderer = {
    invoke: jest.fn(),
    on: jest.fn(),
    send: jest.fn()
  };
  
  const mockApp = {
    getPath: jest.fn().mockImplementation((path) => {
      if (path === 'userData') return 'C:\\Users\\TestUser\\AppData\\Roaming\\CleanC';
      if (path === 'temp') return 'C:\\Users\\TestUser\\AppData\\Local\\Temp';
      if (path === 'home') return 'C:\\Users\\TestUser';
      return '/mock-path';
    }),
    on: jest.fn(),
    whenReady: jest.fn().mockResolvedValue({}),
    quit: jest.fn()
  };

  const mockDialog = {
    showMessageBox: jest.fn().mockResolvedValue({ response: 0 }),
    showOpenDialog: jest.fn().mockResolvedValue({
      canceled: false,
      filePaths: ['C:\\mock\\path']
    }),
    showSaveDialog: jest.fn().mockResolvedValue({
      canceled: false,
      filePath: 'C:\\mock\\save\\path'
    })
  };

  const mockShell = {
    openExternal: jest.fn(),
    openPath: jest.fn(),
    showItemInFolder: jest.fn()
  };

  return {
    ipcMain: mockIpcMain,
    ipcRenderer: mockIpcRenderer,
    app: mockApp,
    dialog: mockDialog,
    shell: mockShell,
    BrowserWindow: jest.fn().mockImplementation(() => ({
      loadFile: jest.fn(),
      on: jest.fn(),
      webContents: {
        openDevTools: jest.fn(),
        on: jest.fn(),
        send: jest.fn()
      },
      show: jest.fn(),
      maximize: jest.fn(),
      close: jest.fn(),
      isDestroyed: jest.fn().mockReturnValue(false)
    }))
  };
});

// 模拟fs模块
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  statSync: jest.fn().mockImplementation((path) => ({
    isFile: () => !path.endsWith('\\'),
    isDirectory: () => path.endsWith('\\'),
    size: 1024 * 1024 * 10, // 10MB
    mtime: new Date()
  })),
  readdirSync: jest.fn().mockReturnValue(['file1.txt', 'file2.txt', 'subfolder']),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('mock file content')),
  unlinkSync: jest.fn(),
  rmdirSync: jest.fn(),
  createReadStream: jest.fn().mockReturnValue({
    on: jest.fn().mockImplementation(function(event, callback) {
      if (event === 'data') callback(Buffer.from('mock data chunk'));
      if (event === 'end') callback();
      return this;
    }),
    pipe: jest.fn().mockReturnThis()
  })
}));

// 模拟path模块
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    join: jest.fn().mockImplementation((...args) => args.join('\\')),
    resolve: jest.fn().mockImplementation((...args) => args.join('\\')),
    dirname: jest.fn().mockImplementation((p) => p.split('\\').slice(0, -1).join('\\') || '.'),
    basename: jest.fn().mockImplementation((p) => p.split('\\').pop() || '')
  };
});

// 模拟node-disk-info
jest.mock('node-disk-info', () => ({
  getDiskInfoSync: jest.fn().mockReturnValue([
    {
      mounted: 'C:',
      filesystem: 'NTFS',
      blocks: 1024 * 1024 * 1024 * 250, // 250GB
      used: 1024 * 1024 * 1024 * 120,   // 120GB
      available: 1024 * 1024 * 1024 * 130, // 130GB
      capacity: '48%',
      isRemovable: false
    }
  ])
}));

// 模拟child_process
jest.mock('child_process', () => ({
  execSync: jest.fn().mockReturnValue(Buffer.from('mock command output')),
  exec: jest.fn().mockImplementation((cmd, cb) => cb(null, 'mock output', ''))
}));

// 设置测试全局变量
global.mockElectronEnv = {
  appDataPath: 'C:\\Users\\TestUser\\AppData\\Roaming\\CleanC',
  tempPath: 'C:\\Users\\TestUser\\AppData\\Local\\Temp',
  homePath: 'C:\\Users\\TestUser'
}; 