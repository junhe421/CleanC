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
        subtitle: '快速安全地清理您的C盘，释放宝贵空间',
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
        scanTitle: '点击下方按钮开始扫描',
        scanDesc: '我们将安全地分析您的系统并找出可以清理的文件',
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
        resultDesc: '以下是占用空间最大的文件',
        placeholderDesc: '点击上方按钮开始查找占用空间较大的文件',
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
        uninstallError: '程序卸载失败',
        smartCategory: '智能程序分类',
        filterRarelyUsed: '筛选不常用',
        filterLargeApps: '筛选大型程序',
        filterOldApps: '筛选旧程序',
        clearFilters: '清除筛选',
        showingPrograms: '显示',
        totalPrograms: '个程序',
        publisher: '发布商',
        unknownPublisher: '未知发布商',
        unknownDate: '未知日期',
        unknownSize: '未知大小'
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
        tb: 'TB',
        // 错误和确认消息
        scanError: '扫描过程中出现错误，请重试。',
        cleanError: '清理过程中出现错误，请重试。',
        selectAtLeastOne: '请至少选择一项需要清理的内容',
        confirmClean: '确定要清理所选项目吗？这将永久删除这些文件。',
        confirmDelete: '确定要删除此文件吗？',
        operationCannotUndo: '此操作不可恢复！',
        deleteSuccess: '文件已成功删除！',
        deleteFailed: '删除文件失败',
        openLocationFailed: '无法打开文件位置',
        unknownError: '未知错误',
        confirmUninstall: '确定要卸载',
        uninstallStarted: '的卸载程序已启动，请按照卸载向导完成卸载。完成后请刷新列表。',
        uninstallFailed: '卸载失败',
        cannotUninstall: '抱歉，无法卸载',
        noUninstallCommand: '未找到卸载命令。'
      },
      
      // 底部信息
      footer: {
        technicalSupport: '技术支持',
        wechatAccount: '查看公众号',
        aboutApp: '关于CleanC',
        designedFor: '为电脑小白设计',
        version: '版本 1.0.0'
      },
      
      // 语言切换
      language: {
        switchLanguage: '切换语言',
        chinese: '中文',
        english: 'English'
      },
      
      // 关于对话框
      about: {
        title: '关于 CleanC',
        version: '版本 1.0.0',
        description: 'CleanC是一款专为电脑初学者设计的C盘清理与优化工具。它提供了比市面上同类产品更快速、界面更直观友好的体验，让用户能够安全、轻松地管理和释放C盘空间。',
        techProvider: '技术提供',
        companyDesc: 'Next Wave 是一家专注于创新软件解决方案的技术公司，致力于打造简单易用、功能强大的应用程序。我们相信科技应该让生活变得更简单，而不是更复杂。',
        followUs: '关注我们的公众号',
        qrDesc: '扫描二维码，获取更多系统优化技巧与软件更新',
        copyright: '© 2025 Next Wave. 保留所有权利。'
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
        subtitle: 'Quickly and safely clean your C drive, free up precious space',
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
        scanTitle: 'Click the button below to start scanning',
        scanDesc: 'We will safely analyze your system and find files that can be cleaned',
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
        resultDesc: 'Here are the files that take up the most space',
        placeholderDesc: 'Click the button above to start finding large files',
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
        uninstallError: 'Failed to uninstall programs',
        smartCategory: 'Smart Program Categories',
        filterRarelyUsed: 'Filter Rarely Used',
        filterLargeApps: 'Filter Large Programs',
        filterOldApps: 'Filter Old Programs',
        clearFilters: 'Clear Filters',
        showingPrograms: 'Showing',
        totalPrograms: 'programs',
        publisher: 'Publisher',
        unknownPublisher: 'Unknown Publisher',
        unknownDate: 'Unknown Date',
        unknownSize: 'Unknown Size'
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
        tb: 'TB',
        // Error and confirmation messages
        scanError: 'An error occurred during scanning, please try again.',
        cleanError: 'An error occurred during cleaning, please try again.',
        selectAtLeastOne: 'Please select at least one item to clean',
        confirmClean: 'Are you sure you want to clean the selected items? This will permanently delete these files.',
        confirmDelete: 'Are you sure you want to delete this file?',
        operationCannotUndo: 'This operation cannot be undone!',
        deleteSuccess: 'File deleted successfully!',
        deleteFailed: 'Failed to delete file',
        openLocationFailed: 'Cannot open file location',
        unknownError: 'Unknown error',
        confirmUninstall: 'Are you sure you want to uninstall',
        uninstallStarted: ' uninstaller has been started. Please follow the uninstall wizard to complete the uninstallation. Please refresh the list after completion.',
        uninstallFailed: 'Failed to uninstall',
        cannotUninstall: 'Sorry, cannot uninstall',
        noUninstallCommand: ', uninstall command not found.'
      },
      
      // Footer info
      footer: {
        technicalSupport: 'Technical Support',
        wechatAccount: 'WeChat Account',
        aboutApp: 'About CleanC',
        designedFor: 'Designed for Beginners',
        version: 'Version 1.0.0'
      },
      
      // Language switching
      language: {
        switchLanguage: 'Switch Language',
        chinese: '中文',
        english: 'English'
      },
      
      // About dialog
      about: {
        title: 'About CleanC',
        version: 'Version 1.0.0',
        description: 'CleanC is a C drive cleaning and optimization tool designed specifically for computer beginners. It provides a faster and more intuitive user experience than similar products on the market, allowing users to safely and easily manage and free up C drive space.',
        techProvider: 'Technology Provider',
        companyDesc: 'Next Wave is a technology company focused on innovative software solutions, committed to creating simple, easy-to-use, and powerful applications. We believe technology should make life simpler, not more complex.',
        followUs: 'Follow Our WeChat',
        qrDesc: 'Scan the QR code to get more system optimization tips and software updates',
        copyright: '© 2025 Next Wave. All rights reserved.'
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

    // 如果程序卸载页面已经加载，重新渲染程序列表
    if (document.querySelector('.smart-select-header')) {
      this.refreshDynamicContent();
    }
  }

  // 刷新动态生成的内容
  refreshDynamicContent() {
    // 更新智能程序分类头部
    const smartHeader = document.querySelector('.smart-select-header');
    if (smartHeader) {
      const h3 = smartHeader.querySelector('h3');
      if (h3) {
        h3.textContent = this.t('uninstall.smartCategory');
      }

      // 更新按钮文本
      const buttons = smartHeader.querySelectorAll('.smart-select-btn');
      if (buttons.length >= 4) {
        buttons[0].innerHTML = `<i class="fas fa-clock"></i> ${this.t('uninstall.filterRarelyUsed')}`;
        buttons[1].innerHTML = `<i class="fas fa-database"></i> ${this.t('uninstall.filterLargeApps')}`;
        buttons[2].innerHTML = `<i class="fas fa-history"></i> ${this.t('uninstall.filterOldApps')}`;
        buttons[3].innerHTML = `<i class="fas fa-eraser"></i> ${this.t('uninstall.clearFilters')}`;
      }

      // 更新程序计数显示
      const filteredCount = smartHeader.querySelector('.filtered-count');
      if (filteredCount) {
        const currentText = filteredCount.textContent;
        const numbers = currentText.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
          filteredCount.textContent = `${this.t('uninstall.showingPrograms')} ${numbers[0]}/${numbers[1]} ${this.t('uninstall.totalPrograms')}`;
        }
      }
    }

    // 更新表格头部
    const tableHeader = document.querySelector('.app-table thead');
    if (tableHeader) {
      const ths = tableHeader.querySelectorAll('th');
      if (ths.length >= 6) {
        ths[0].textContent = this.t('uninstall.programName');
        ths[1].textContent = this.t('uninstall.publisher');
        ths[2].textContent = this.t('uninstall.version');
        ths[3].textContent = this.t('uninstall.installDate');
        ths[4].textContent = this.t('uninstall.size');
        ths[5].textContent = this.t('uninstall.actions');
      }
    }

    // 更新卸载按钮
    const uninstallBtns = document.querySelectorAll('.uninstall-btn');
    uninstallBtns.forEach(btn => {
      if (btn.textContent.trim() === '卸载' || btn.textContent.trim() === 'Uninstall') {
        btn.textContent = this.t('uninstall.uninstall');
        btn.title = this.t('uninstall.uninstall');
      }
    });

    // 更新未知信息的显示
    const unknownElements = document.querySelectorAll('.app-table tbody td');
    unknownElements.forEach(td => {
      if (td.innerHTML.includes('未知发布商') || td.innerHTML.includes('Unknown Publisher')) {
        td.innerHTML = `<i class="fas fa-building"></i> <span style="color:#888">${this.t('uninstall.unknownPublisher')}</span>`;
      } else if (td.innerHTML.includes('未知日期') || td.innerHTML.includes('Unknown Date')) {
        td.innerHTML = `<i class="fas fa-calendar"></i> <span style="color:#888">${this.t('uninstall.unknownDate')}</span>`;
      } else if (td.innerHTML.includes('未知大小') || td.innerHTML.includes('Unknown Size')) {
        td.innerHTML = `<i class="fas fa-weight"></i> <span style="color:#888">${this.t('uninstall.unknownSize')}</span>`;
      }
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