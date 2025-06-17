// 国际化系统 (i18n) - 支持中英文切换
class I18n {
  constructor() {
    this.currentLanguage = this.getStoredLanguage() || 'zh-CN';
    this.translations = {};
    this.loadTranslations();
  }

  // 获取存储的语言设置
  getStoredLanguage() {
    return localStorage.getItem('cleanc-language');
  }

  // 存储语言设置
  setStoredLanguage(language) {
    localStorage.setItem('cleanc-language', language);
  }

  // 加载翻译文件
  loadTranslations() {
    // 中文翻译
    this.translations['zh-CN'] = {
      // 应用标题和基本信息
      appTitle: 'CleanC - 简单易用的C盘清理工具',
      appName: 'CleanC',
      
      // 导航菜单
      nav: {
        dashboard: '主页',
        quickClean: '快速清理',
        largeFiles: '大文件查找',
        duplicateFiles: '重复文件',
        uninstall: '程序卸载'
      },
      
            // 主页面板
      dashboard: {
        title: '欢迎使用 CleanC 清理工具',
        totalSpace: '总容量',
        usedSpace: '已用空间',
        freeSpace: '可用空间',
        scanSystemBtn: '开始扫描系统',
        systemStatus: '系统状态',
        diskUsage: 'C盘使用情况',
        usedSpaceLabel: '已用空间',
        freeSpaceLabel: '可用空间',
        quickTips: '快速小贴士',
        tip1Title: '定期清理临时文件',
        tip1Content: '临时文件会占用大量空间，建议每周清理一次',
        tip2Title: '注意备份重要文件',
        tip2Content: '清理前请确保重要文件已备份',
        tip3Title: '卸载不用的程序',
        tip3Content: '卸载长期不用的程序可以释放更多空间'
      },
      
      // 快速清理
      quickClean: {
        title: '快速清理',
        description: '清理临时文件、缓存和其他垃圾文件以释放磁盘空间',
        startScanBtn: '开始扫描',
        scanAgainBtn: '重新扫描',
        cleanSelectedBtn: '清理所选项目',
        scanning: '正在扫描...',
        scanComplete: '扫描完成',
        noItemsFound: '未发现可清理的项目',
        selectAll: '全选',
        deselectAll: '取消全选',
        itemsSelected: '项已选中',
        totalSize: '总大小',
        cleanupComplete: '清理完成',
        freedSpace: '已释放空间',
        cleanupItems: '清理项目',
        itemTypes: {
          tempFiles: '临时文件',
          browserCache: '浏览器缓存',
          systemCache: '系统缓存',
          downloadCache: '下载缓存',
          recycleBin: '回收站'
        }
      },
      
      // 大文件查找
      largeFiles: {
        title: '大文件查找',
        description: '查找占用大量磁盘空间的文件',
        minSizeLabel: '最小文件大小 (MB)',
        startSearchBtn: '查找大文件',
        searching: '正在搜索...',
        searchComplete: '查找结果',
        noFilesFound: '未找到符合条件的文件',
        fileName: '文件名',
        fileSize: '大小',
        filePath: '位置',
        lastModified: '修改时间',
        actions: '操作',
        openLocation: '打开位置',
        deleteFile: '删除文件',
        deleteConfirm: '确定要删除这个文件吗？',
        deleteSuccess: '文件删除成功',
        deleteError: '文件删除失败'
      },
      
      // 重复文件
      duplicateFiles: {
        title: '重复文件查找',
        description: '查找并删除重复的文件以节省空间',
        selectFolderBtn: '选择文件夹',
        startSearchBtn: '查找重复文件',
        searching: '正在搜索重复文件...',
        searchComplete: '搜索完成',
        noDuplicatesFound: '未找到重复文件',
        duplicateGroups: '重复文件组',
        totalDuplicates: '总重复文件',
        potentialSavings: '可节省空间',
        fileName: '文件名',
        fileSize: '文件大小',
        filePath: '文件路径',
        actions: '操作',
        keepThis: '保留此文件',
        deleteThis: '删除此文件',
        openLocation: '打开位置',
        folderDocuments: '我的文档',
        folderDownloads: '下载',
        folderPictures: '图片',
        folderVideos: '视频',
        folderMusic: '音乐',
        folderCustom: '自定义...',
        customPathPlaceholder: '输入自定义路径...',
        searchPath: '搜索路径:',
        placeholderDesc: '选择要扫描的文件夹，然后点击上方按钮开始查找'
      },
      
      // 程序卸载
      uninstall: {
        title: '程序卸载管理',
        description: '查看并卸载不需要的程序',
        loading: '正在加载已安装的程序...',
        searchPlaceholder: '搜索程序...',
        sortBy: '排序',
        sortByName: '按名称',
        sortBySize: '按大小',
        sortByDate: '按安装日期',
        selectAll: '全选',
        deselectAll: '取消全选',
        uninstallSelected: '卸载选中项',
        programName: '程序名称',
        version: '版本',
        size: '大小',
        installDate: '安装日期',
        actions: '操作',
        uninstall: '卸载',
        uninstallConfirm: '确定要卸载这些程序吗？',
        uninstallSuccess: '程序卸载成功',
        uninstallError: '程序卸载失败'
      },
      
      // 通用按钮和消息
      common: {
        ok: '确定',
        cancel: '取消',
        close: '关闭',
        save: '保存',
        delete: '删除',
        loading: '加载中...',
        error: '错误',
        success: '成功',
        warning: '警告',
        info: '信息',
        bytes: '字节',
        kb: 'KB',
        mb: 'MB',
        gb: 'GB',
        tb: 'TB'
      },
      
      // 底部信息
      footer: {
        technicalSupport: '技术支持',
        wechatAccount: '查看公众号',
        aboutApp: '关于CleanC',
        designedFor: '为电脑小白设计'
      },
      
      // 语言切换
      language: {
        switchLanguage: '切换语言',
        chinese: '中文',
        english: 'English'
      }
    };

    // 英文翻译
    this.translations['en-US'] = {
      // Application title and basic info
      appTitle: 'CleanC - Ultimate C Drive Cleaner for Beginners',
      appName: 'CleanC',
      
      // Navigation menu
      nav: {
        dashboard: 'Dashboard',
        quickClean: 'Quick Clean',
        largeFiles: 'Large Files',
        duplicateFiles: 'Duplicate Files',
        uninstall: 'Uninstall Programs'
      },
      
            // Dashboard panel
      dashboard: {
        title: 'Welcome to CleanC Disk Cleaner',
        totalSpace: 'Total Space',
        usedSpace: 'Used Space',
        freeSpace: 'Free Space',
        scanSystemBtn: 'Start System Scan',
        systemStatus: 'System Status',
        diskUsage: 'C Drive Usage',
        usedSpaceLabel: 'Used Space',
        freeSpaceLabel: 'Free Space',
        quickTips: 'Quick Tips',
        tip1Title: 'Clean Temporary Files Regularly',
        tip1Content: 'Temporary files can take up a lot of space, recommend cleaning weekly',
        tip2Title: 'Backup Important Files',
        tip2Content: 'Please ensure important files are backed up before cleaning',
        tip3Title: 'Uninstall Unused Programs',
        tip3Content: 'Uninstalling programs you no longer use can free up more space'
      },
      
      // Quick clean
      quickClean: {
        title: 'Quick Clean',
        description: 'Clean temporary files, caches, and other junk files to free up disk space',
        startScanBtn: 'Start Scan',
        scanAgainBtn: 'Scan Again',
        cleanSelectedBtn: 'Clean Selected Items',
        scanning: 'Scanning...',
        scanComplete: 'Scan Complete',
        noItemsFound: 'No cleanable items found',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        itemsSelected: 'items selected',
        totalSize: 'Total Size',
        cleanupComplete: 'Cleanup Complete',
        freedSpace: 'Space Freed',
        cleanupItems: 'Cleanup Items',
        itemTypes: {
          tempFiles: 'Temporary Files',
          browserCache: 'Browser Cache',
          systemCache: 'System Cache',
          downloadCache: 'Download Cache',
          recycleBin: 'Recycle Bin'
        }
      },
      
      // Large files
      largeFiles: {
        title: 'Large Files Finder',
        description: 'Find files that consume large amounts of disk space',
        minSizeLabel: 'Minimum File Size (MB)',
        startSearchBtn: 'Find Large Files',
        searching: 'Searching...',
        searchComplete: 'Search Results',
        noFilesFound: 'No files found matching criteria',
        fileName: 'File Name',
        fileSize: 'Size',
        filePath: 'Location',
        lastModified: 'Last Modified',
        actions: 'Actions',
        openLocation: 'Open Location',
        deleteFile: 'Delete File',
        deleteConfirm: 'Are you sure you want to delete this file?',
        deleteSuccess: 'File deleted successfully',
        deleteError: 'Failed to delete file'
      },
      
      // Duplicate files
      duplicateFiles: {
        title: 'Duplicate Files Finder',
        description: 'Find and remove duplicate files to save space',
        selectFolderBtn: 'Select Folder',
        startSearchBtn: 'Find Duplicate Files',
        searching: 'Searching for duplicate files...',
        searchComplete: 'Search Complete',
        noDuplicatesFound: 'No duplicate files found',
        duplicateGroups: 'Duplicate File Groups',
        totalDuplicates: 'Total Duplicates',
        potentialSavings: 'Potential Savings',
        fileName: 'File Name',
        fileSize: 'File Size',
        filePath: 'File Path',
        actions: 'Actions',
        keepThis: 'Keep This File',
        deleteThis: 'Delete This File',
        openLocation: 'Open Location',
        folderDocuments: 'Documents',
        folderDownloads: 'Downloads',
        folderPictures: 'Pictures',
        folderVideos: 'Videos',
        folderMusic: 'Music',
        folderCustom: 'Custom...',
        customPathPlaceholder: 'Enter custom path...',
        searchPath: 'Search Path:',
        placeholderDesc: 'Select the folder to scan, then click the button above to start searching'
      },
      
      // Program uninstall
      uninstall: {
        title: 'Program Uninstall Manager',
        description: 'View and uninstall unwanted programs',
        loading: 'Loading installed programs...',
        searchPlaceholder: 'Search programs...',
        sortBy: 'Sort by',
        sortByName: 'By Name',
        sortBySize: 'By Size',
        sortByDate: 'By Install Date',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        uninstallSelected: 'Uninstall Selected',
        programName: 'Program Name',
        version: 'Version',
        size: 'Size',
        installDate: 'Install Date',
        actions: 'Actions',
        uninstall: 'Uninstall',
        uninstallConfirm: 'Are you sure you want to uninstall these programs?',
        uninstallSuccess: 'Programs uninstalled successfully',
        uninstallError: 'Failed to uninstall programs'
      },
      
      // Common buttons and messages
      common: {
        ok: 'OK',
        cancel: 'Cancel',
        close: 'Close',
        save: 'Save',
        delete: 'Delete',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information',
        bytes: 'bytes',
        kb: 'KB',
        mb: 'MB',
        gb: 'GB',
        tb: 'TB'
      },
      
      // Footer info
      footer: {
        technicalSupport: 'Technical Support',
        wechatAccount: 'WeChat Account',
        aboutApp: 'About CleanC',
        designedFor: 'Designed for Beginners'
      },
      
      // Language switching
      language: {
        switchLanguage: 'Switch Language',
        chinese: '中文',
        english: 'English'
      }
    };
  }

  // 获取翻译文本
  t(key) {
    const keys = key.split('.');
    let translation = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        // 如果当前语言没有对应翻译，尝试使用中文
        translation = this.translations['zh-CN'];
        for (const k of keys) {
          if (translation && translation[k]) {
            translation = translation[k];
          } else {
            return key; // 如果都没有，返回原始key
          }
        }
        break;
      }
    }
    
    return translation || key;
  }

  // 切换语言
  switchLanguage(language) {
    if (this.translations[language]) {
      this.currentLanguage = language;
      this.setStoredLanguage(language);
      this.updatePageTranslations();
      this.updatePageDirection();
    }
  }

  // 获取当前语言
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // 更新页面翻译
  updatePageTranslations() {
    // 更新文档标题
    document.title = this.t('appTitle');
    
    // 更新HTML lang属性
    document.documentElement.lang = this.currentLanguage;
    
    // 更新所有带有 data-i18n 属性的元素
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });

    // 更新所有带有 data-i18n-placeholder 属性的元素
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });

    // 更新所有带有 data-i18n-title 属性的元素
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.t(key);
    });
  }

  // 更新页面方向 (中文和英文都是从左到右，所以这里主要是为了扩展性)
  updatePageDirection() {
    const direction = this.currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
  }

  // 初始化国际化
  init() {
    this.updatePageTranslations();
    this.updatePageDirection();
    this.initLanguageSwitcher();
  }

  // 初始化语言切换器
  initLanguageSwitcher() {
    // 创建语言切换按钮
    const languageSwitcher = document.createElement('div');
    languageSwitcher.className = 'language-switcher';
    languageSwitcher.innerHTML = `
      <button class="language-btn" id="language-switcher-btn">
        <i class="fas fa-globe"></i>
        <span>${this.currentLanguage === 'zh-CN' ? '中文' : 'English'}</span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div class="language-dropdown" id="language-dropdown">
        <div class="language-option ${this.currentLanguage === 'zh-CN' ? 'active' : ''}" data-lang="zh-CN">
          <span>中文</span>
        </div>
        <div class="language-option ${this.currentLanguage === 'en-US' ? 'active' : ''}" data-lang="en-US">
          <span>English</span>
        </div>
      </div>
    `;

    // 添加到侧边栏
    const sidebar = document.querySelector('.sidebar');
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) {
      sidebarFooter.insertBefore(languageSwitcher, sidebarFooter.firstChild);
    } else {
      sidebar.appendChild(languageSwitcher);
    }

    // 绑定事件
    this.bindLanguageSwitcherEvents();
  }

  // 绑定语言切换器事件
  bindLanguageSwitcherEvents() {
    const switcherBtn = document.getElementById('language-switcher-btn');
    const dropdown = document.getElementById('language-dropdown');
    const options = document.querySelectorAll('.language-option');

    // 切换下拉菜单显示
    switcherBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // 点击选项切换语言
    options.forEach(option => {
      option.addEventListener('click', () => {
        const lang = option.getAttribute('data-lang');
        if (lang !== this.currentLanguage) {
          this.switchLanguage(lang);
          
          // 更新按钮显示
          const btnText = switcherBtn.querySelector('span');
          btnText.textContent = lang === 'zh-CN' ? '中文' : 'English';
          
          // 更新选项状态
          options.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
        }
        dropdown.classList.remove('show');
      });
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });
  }
}

// 创建全局i18n实例
window.i18n = new I18n(); 