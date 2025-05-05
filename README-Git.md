# CleanC 项目 Git 使用指南

这个文档提供了 CleanC 项目的 Git 版本管理使用说明，帮助团队成员更好地协作开发。

## 基本操作

### 1. 初始化仓库

如果你是第一次设置此仓库：

```bash
git init
git add .
git commit -m "初始化项目"
```

### 2. 添加远程仓库

```bash
git remote add origin [远程仓库URL]
git push -u origin master
```

### 3. 日常工作流程

```bash
# 获取最新代码
git pull

# 查看当前状态
git status

# 添加修改的文件
git add .

# 提交修改
git commit -m "描述你的修改"

# 推送到远程仓库
git push
```

## 分支管理

### 创建新功能分支

```bash
git checkout -b feature/新功能名称
```

### 合并功能分支

```bash
git checkout master
git merge feature/新功能名称
```

### 删除已合并的分支

```bash
git branch -d feature/新功能名称
```

## 提交规范

为了保持提交历史的清晰，请遵循以下提交消息格式：

- `feat: 添加了新功能`
- `fix: 修复了某个bug`
- `docs: 更新了文档`
- `style: 格式调整，不影响代码运行`
- `refactor: 重构代码，不添加新功能或修复bug`
- `test: 添加或修改测试代码`
- `chore: 修改构建过程或辅助工具`

例如：`feat: 添加系统文件清理功能`

## 忽略文件

项目已配置 `.gitignore` 文件，以下文件不会被版本控制：

- `node_modules/` 目录
- 构建输出 (`dist/`, `build/`, `out/`)
- 日志文件
- 环境变量文件 (`.env`)
- 编辑器配置文件
- 二进制安装包

## 行尾处理

已配置 `.gitattributes` 文件处理不同操作系统的行尾问题：

- 源代码文件使用 LF 换行符
- Windows 批处理文件保持 CRLF 换行符
- 二进制文件不进行修改

## 常见问题解决

### 撤销本地修改

```bash
git checkout -- <文件名>
```

### 撤销已暂存的修改

```bash
git reset HEAD <文件名>
```

### 修改最后一次提交

```bash
git commit --amend
```

### 查看提交历史

```bash
git log --oneline --graph
```

## 推荐的 Git 工具

- Visual Studio Code Git 集成
- GitHub Desktop
- GitKraken
- SourceTree

如有任何问题，请联系项目负责人。 