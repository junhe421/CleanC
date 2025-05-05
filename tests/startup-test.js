/**
 * 开机加速功能单元测试
 * 测试开机启动项管理功能是否能够正常工作
 */

const path = require('path');
const assert = require('assert');
const { exec } = require('child_process');
const Registry = require('winreg');

// 测试注册表功能
describe('启动项管理功能测试', function() {
  this.timeout(10000); // 增加超时时间为10秒
  
  // 测试数据 - 创建一个临时测试启动项
  const testAppName = 'CleanCTestApp';
  const testAppCommand = 'C:\\Windows\\System32\\notepad.exe';
  const regKeyPath = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
  
  // 清除测试数据的函数
  async function cleanupTestData() {
    return new Promise((resolve, reject) => {
      try {
        const regKey = new Registry({
          hive: Registry.HKCU,
          key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
        });
        
        regKey.valueExists(testAppName, (err, exists) => {
          if (err || !exists) {
            resolve();
            return;
          }
          
          regKey.remove(testAppName, (err) => {
            if (err) console.warn('清理测试数据失败:', err);
            resolve();
          });
        });
      } catch (err) {
        console.warn('清理时发生错误:', err);
        resolve();
      }
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
  
  // 测试1: 使用PowerShell添加启动项
  it('应该能使用PowerShell添加启动项', async function() {
    const psCommand = `
      $registryPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
      New-ItemProperty -Path $registryPath -Name "${testAppName}" -Value "${testAppCommand}" -PropertyType String -Force
    `;
    
    await new Promise((resolve, reject) => {
      exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
        if (error) {
          console.error('PowerShell执行错误:', error);
          reject(error);
          return;
        }
        resolve();
      });
    });
    
    // 验证是否成功添加
    const exists = await checkRegistryItem(testAppName);
    assert.strictEqual(exists, true, '启动项应该已经被添加');
  });
  
  // 测试2: 使用PowerShell删除启动项
  it('应该能使用PowerShell删除启动项', async function() {
    const psCommand = `
      $registryPath = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
      Remove-ItemProperty -Path $registryPath -Name "${testAppName}" -Force -ErrorAction SilentlyContinue
    `;
    
    await new Promise((resolve, reject) => {
      exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
        if (error) {
          console.error('PowerShell执行错误:', error);
          reject(error);
          return;
        }
        resolve();
      });
    });
    
    // 验证是否成功删除
    const exists = await checkRegistryItem(testAppName);
    assert.strictEqual(exists, false, '启动项应该已经被删除');
  });
  
  // 测试3: 使用Registry API添加启动项
  it('应该能使用Registry API添加启动项', async function() {
    await new Promise((resolve, reject) => {
      try {
        const regKey = new Registry({
          hive: Registry.HKCU,
          key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
        });
        
        regKey.set(testAppName, Registry.REG_SZ, testAppCommand, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
    
    // 验证是否成功添加
    const exists = await checkRegistryItem(testAppName);
    assert.strictEqual(exists, true, '启动项应该已经被添加');
  });
  
  // 测试4: 使用Registry API删除启动项
  it('应该能使用Registry API删除启动项', async function() {
    await new Promise((resolve, reject) => {
      try {
        const regKey = new Registry({
          hive: Registry.HKCU,
          key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
        });
        
        regKey.remove(testAppName, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
    
    // 验证是否成功删除
    const exists = await checkRegistryItem(testAppName);
    assert.strictEqual(exists, false, '启动项应该已经被删除');
  });
});

// 辅助函数：检查注册表项是否存在
async function checkRegistryItem(name) {
  return new Promise((resolve, reject) => {
    try {
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
    } catch (err) {
      console.error('检查注册表项时发生异常:', err);
      reject(err);
    }
  });
}

// 辅助函数：获取所有启动项
async function getAllStartupItems() {
  return new Promise((resolve, reject) => {
    try {
      const regKey = new Registry({
        hive: Registry.HKCU,
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
      });
      
      regKey.values((err, items) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(items || []);
      });
    } catch (err) {
      reject(err);
    }
  });
} 