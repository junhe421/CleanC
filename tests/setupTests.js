/**
 * 测试初始化配置文件
 * 在所有测试之前运行，用于设置全局配置和模拟全局对象
 */

// 禁用控制台输出，使测试输出更清晰
global.console = {
  ...console,
  // 注释下面的行以查看实际日志输出
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// 模拟Electron主进程的IPC通信
jest.mock('electron', () => require('./mocks/electron.js'));

// 设置测试超时延迟
jest.setTimeout(10000);

// 清除所有模拟实现
beforeEach(() => {
  jest.clearAllMocks();
}); 