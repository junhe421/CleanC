/**
 * CleanC 原生模块生成器
 * 此脚本将关键函数编译为原生C++二进制模块，提供更强的代码保护
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 创建导出关键函数的新文件
console.log('正在准备创建原生模块...');

// 确保目录存在
const nativeDir = path.join(__dirname, 'native');
if (!fs.existsSync(nativeDir)) {
  fs.mkdirSync(nativeDir);
}

// 创建原生模块绑定文件
const bindingFile = path.join(nativeDir, 'cleanc_core.cc');
console.log(`创建C++绑定文件: ${bindingFile}`);

// 一些关键函数的C++实现
const cppSource = `
#include <nan.h>
#include <string>
#include <vector>
#include <algorithm>
#include <fstream>
#include <sstream>

// 计算文件哈希值（用于重复文件检测）
void CalculateFileHash(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 1) {
    Nan::ThrowTypeError("需要提供文件路径参数");
    return;
  }
  
  if (!info[0]->IsString()) {
    Nan::ThrowTypeError("文件路径必须是字符串");
    return;
  }
  
  std::string filePath = *Nan::Utf8String(info[0]);
  
  // 简单哈希实现 - 仅用于演示
  // 实际生产中应使用更强大的哈希算法
  std::ifstream file(filePath, std::ios::binary);
  if (!file) {
    Nan::ThrowError("无法打开文件");
    return;
  }
  
  std::stringstream buffer;
  buffer << file.rdbuf();
  std::string content = buffer.str();
  
  // 简单的哈希计算 (仅用于演示)
  uint32_t hash = 0;
  for (char c : content) {
    hash = ((hash << 5) + hash) + c;
  }
  
  char hashStr[20];
  sprintf(hashStr, "%x", hash);
  
  info.GetReturnValue().Set(Nan::New<v8::String>(hashStr).ToLocalChecked());
}

// 高性能文件大小计算
void GetDirectorySize(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 1 || !info[0]->IsString()) {
    Nan::ThrowTypeError("需要提供目录路径参数");
    return;
  }
  
  std::string dirPath = *Nan::Utf8String(info[0]);
  
  // 在实际应用中，这里会有递归计算目录大小的代码
  // 现在返回一个模拟值
  int64_t size = 1024 * 1024 * 10; // 假设10MB
  
  info.GetReturnValue().Set(Nan::New<v8::Number>(static_cast<double>(size)));
}

// 初始化模块
NAN_MODULE_INIT(Init) {
  Nan::Set(target, 
    Nan::New<v8::String>("calculateFileHash").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(CalculateFileHash)).ToLocalChecked()
  );
  
  Nan::Set(target,
    Nan::New<v8::String>("getDirectorySize").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(GetDirectorySize)).ToLocalChecked()
  );
}

NODE_MODULE(cleanc_core, Init)
`;

fs.writeFileSync(bindingFile, cppSource);

// 创建binding.gyp文件
const gypFile = path.join(nativeDir, 'binding.gyp');
console.log(`创建binding.gyp: ${gypFile}`);

const gypContent = `{
  "targets": [
    {
      "target_name": "cleanc_core",
      "sources": [ "cleanc_core.cc" ],
      "include_dirs": [
        "<!(node -e \\"require('nan')\\")"
      ]
    }
  ]
}`;

fs.writeFileSync(gypFile, gypContent);

// 创建package.json
const packageFile = path.join(nativeDir, 'package.json');
console.log(`创建package.json: ${packageFile}`);

const packageContent = `{
  "name": "cleanc-native",
  "version": "1.0.0",
  "description": "CleanC的原生扩展模块",
  "main": "index.js",
  "private": true,
  "scripts": {
    "install": "node-gyp rebuild"
  },
  "dependencies": {
    "nan": "^2.17.0"
  }
}`;

fs.writeFileSync(packageFile, packageContent);

// 创建简单的JavaScript包装器
const indexFile = path.join(nativeDir, 'index.js');
console.log(`创建JavaScript接口: ${indexFile}`);

const indexContent = `try {
  module.exports = require('./build/Release/cleanc_core.node');
} catch (e) {
  console.error('无法加载原生模块，使用备用实现');
  
  // 提供JS回退实现
  module.exports = {
    calculateFileHash: function(filePath) {
      const crypto = require('crypto');
      const fs = require('fs');
      
      // 只读取部分文件用于哈希计算
      const buffer = Buffer.alloc(8192);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 8192, 0);
      fs.closeSync(fd);
      
      return crypto.createHash('md5').update(buffer).digest('hex');
    },
    
    getDirectorySize: function(dirPath) {
      // 备用实现
      return 1024 * 1024 * 10; // 假设10MB
    }
  };
}`;

fs.writeFileSync(indexFile, indexContent);

// 指导如何安装和编译
console.log('\n原生模块文件已创建完成！');
console.log('要编译此模块，请执行以下步骤：');
console.log('1. cd native');
console.log('2. npm install');
console.log('3. 编译成功后，可以在main.js中导入并使用这个模块');
console.log('   例如: const cleanCore = require("./native");');
console.log('使用这种方式，核心代码将以二进制形式分发，难以逆向工程。'); 