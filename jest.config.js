/**
 * Jest测试配置文件
 * 用于配置CleanC应用的单元测试环境
 */

module.exports = {
  // 测试环境，使用Node.js环境
  testEnvironment: 'node',
  
  // 测试文件的模式
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // 覆盖率收集配置
  collectCoverageFrom: [
    'src/**/*.js',
    '!**/node_modules/**'
  ],
  
  // 覆盖率报告目录
  coverageDirectory: 'coverage',
  
  // 是否显示覆盖率报告
  collectCoverage: true,
  
  // 测试超时时间（毫秒）
  testTimeout: 10000,
  
  // 模块目录
  moduleDirectories: ['node_modules', 'src'],
  
  // 忽略的路径
  testPathIgnorePatterns: ['/node_modules/'],
  
  // 允许测试覆盖的最大文件大小
  maxWorkers: '50%',
  
  // 在每个测试文件之前设置测试环境
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  
  // 模拟路径映射
  moduleNameMapper: {
    '^electron$': '<rootDir>/tests/mocks/electron.js'
  }
}; 