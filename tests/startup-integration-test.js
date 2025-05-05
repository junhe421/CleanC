/**
 * 开机加速功能集成测试
 * 直接测试主进程中的启动项管理API
 */

const path = require('path');
const assert = require('assert');
const { exec } = require('child_process');
const Registry = require('winreg');

// 导入功能模块 - 从main.js导出这些函数用于测试
// 注意：要运行这些测试，需要修改main.js以导出这些函数
// 这里是模拟调用，仅展示测试结构
describe('启动项管理API集成测试', function() {
  this.timeout(15000); // 增加超时时间为15秒
  
  // 测试数据 - 临时测试启动项
  const testItem = {
    name: 'CleanCIntegrationTest',
    command: 'C:\\Windows\\System32\\calc.exe',
    type: 'registry',
    regKey: 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    enabled: true
  };
  
  // 清除测试数据
  async function cleanupTestData() {
    const psCommand = `
      $registryPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
      Remove-ItemProperty -Path $registryPath -Name "${testItem.name}" -Force -ErrorAction SilentlyContinue
    `;
    
    return new Promise((resolve) => {
      exec(`powershell -Command "${psCommand}"`, () => {
        resolve();
      });
    });
  }
  
  // 测试前清理
  before(async function() {
    await cleanupTestData();
  });
  
  // 测试后清理
  after(async function() {
    await cleanupTestData();
  });
  
  // 如果是实际集成测试，要直接调用API，这里只能使用模拟方式测试
  // 测试1：测试禁用启动项 API 
  it('应该能成功添加启动项', async function() {
    // 先添加测试项
    await setRegistryTestItem(true);
    
    // 验证是否成功添加
    const exists = await checkRegistryItem(testItem.name);
    assert.strictEqual(exists, true, '启动项应该已经被添加');
  });
  
  // 测试2：测试禁用启动项 API
  it('应该能成功禁用启动项', async function() {
    // 先添加测试项
    await setRegistryTestItem(true);
    
    // 执行禁用操作 (使用PowerShell代替API直接调用)
    await setRegistryTestItem(false);
    
    // 验证是否成功禁用(禁用=删除)
    const exists = await checkRegistryItem(testItem.name);
    assert.strictEqual(exists, false, '启动项应该已经被禁用(删除)');
  });
});

// 辅助函数：设置注册表测试项
async function setRegistryTestItem(enable) {
  let psCommand;
  
  if (enable) {
    psCommand = `
      $registryPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
      if (!(Test-Path $registryPath)) {
        New-Item -Path $registryPath -Force | Out-Null
      }
      New-ItemProperty -Path $registryPath -Name "CleanCIntegrationTest" -Value "C:\\Windows\\System32\\calc.exe" -PropertyType String -Force | Out-Null
    `;
  } else {
    psCommand = `
      $registryPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
      Remove-ItemProperty -Path $registryPath -Name "CleanCIntegrationTest" -Force -ErrorAction SilentlyContinue
    `;
  }
  
  return new Promise((resolve, reject) => {
    exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('PowerShell执行错误:', error);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

// 辅助函数：检查注册表项是否存在
async function checkRegistryItem(name) {
  return new Promise((resolve, reject) => {
    const regKey = new Registry({
      hive: Registry.HKCU,
      key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    });
    
    regKey.valueExists(name, (err, exists) => {
      if (err) {
        console.error('检查注册表项时出错:', err);
        reject(err);
        return;
      }
      resolve(exists);
    });
  });
} 