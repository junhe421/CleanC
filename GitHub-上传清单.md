# GitHub上传检查清单

## 📤 上传前必检项目

### ✅ 必须上传的文件
- [ ] `main.js` - Electron主进程
- [ ] `index.html` - 主界面
- [ ] `package.json` - 项目配置
- [ ] `src/` - 源代码目录
- [ ] `assets/` - 资源文件
- [ ] `tests/` - 测试文件
- [ ] `docs/` - 文档目录
- [ ] `README.md` - 项目文档
- [ ] `LICENSE` - 开源许可证
- [ ] `.gitignore` - Git忽略配置
- [ ] 构建脚本（*.bat文件）

### ❌ 不应上传的文件
- [ ] `node_modules/` - 依赖包目录
- [ ] `dist/` - 构建输出
- [ ] `coverage/` - 测试覆盖率
- [ ] `package-lock.json` - NPM锁定文件
- [ ] `backup_*/` - 备份目录
- [ ] `build-temp/` - 临时构建文件

### 🔍 上传前检查
1. [ ] 运行 `git status` 确认要提交的文件
2. [ ] 检查敏感信息（API密钥、密码等）
3. [ ] 确认README.md内容完整
4. [ ] 验证.gitignore配置正确
5. [ ] 检查许可证文件存在

### 📁 推荐的Git命令序列
```bash
# 1. 添加所有需要的文件
git add .

# 2. 检查状态
git status

# 3. 提交代码
git commit -m "feat: 初始版本 - CleanC极简C盘清理工具"

# 4. 推送到GitHub
git push origin main
```

## 📊 文件大小统计
- 总项目大小（不含node_modules）: ~10MB
- 核心代码文件: ~200KB
- 资源文件: ~150KB
- 文档文件: ~15KB

## ⚠️ 注意事项
1. 首次上传可能较慢，因为包含较多资源文件
2. 建议创建.github/workflows/目录添加CI/CD配置
3. 考虑添加CONTRIBUTING.md指导贡献者
4. 可以创建issue和pull request模板 