const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// 要混淆的文件清单
const filesToObfuscate = [
  { input: './main.js', output: './dist/CleanC-Package/main.js' },
  { input: './src/js/renderer.js', output: './dist/CleanC-Package/src/js/renderer.js' }
];

// 混淆配置
const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.7,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: 1000,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersType: 'function',
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

// 创建备份目录
const currentDate = new Date();
const dateStr = `${currentDate.getFullYear()}${(currentDate.getMonth()+1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}`;
const backupDir = `./backup_${dateStr}`;

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 混淆文件处理函数
function obfuscateFile(inputPath, outputPath) {
  try {
    // 读取源文件
    const sourceCode = fs.readFileSync(inputPath, 'utf8');
    
    // 创建备份
    const filename = path.basename(inputPath);
    const backupPath = path.join(backupDir, filename);
    fs.writeFileSync(backupPath, sourceCode, 'utf8');
    console.log(`已备份原始文件到: ${backupPath}`);
    
    // 混淆代码
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(
      sourceCode,
      obfuscationOptions
    ).getObfuscatedCode();
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 保存混淆后的代码
    fs.writeFileSync(outputPath, obfuscatedCode, 'utf8');
    console.log(`文件混淆成功: ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`处理文件 ${inputPath} 失败:`, error);
    return false;
  }
}

// 执行混淆处理
console.log('开始混淆JavaScript文件...');
let successCount = 0;

for (const file of filesToObfuscate) {
  if (fs.existsSync(file.input)) {
    const success = obfuscateFile(file.input, file.output);
    if (success) successCount++;
  } else {
    console.log(`跳过不存在的文件: ${file.input}`);
  }
}

console.log(`混淆完成！成功处理 ${successCount}/${filesToObfuscate.length} 个文件`);
console.log(`原始文件已备份到: ${backupDir}`); 