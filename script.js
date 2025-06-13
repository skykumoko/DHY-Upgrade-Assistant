/**
 * 密探升级助手 - 资源追踪系统 (GitHub Gist版)
 * 功能：使用GitHub Gist保存升级材料、历练进度和属性状态
 */
const ResourceTracker = (() => {
    // ==================== 配置常量 ====================
    const CONFIG = {
        containerId: '#resourceTracker',
        elements: {
            // 核心元素
            classStatus: '#classStatus',
            attributeStatus: '#attributeStatus',
            materialsList: '#materials-list',
            
            // 金钱和经验
            moneyCheck: '#money-check',
            fragments: '#fragments',
            scrolls: '#scrolls',
            expStatus: '#exp-status',
            
            // 历练相关
            yinYangTraining: '#yinYangTraining',
            windFireTraining: '#windFireTraining',
            earthWaterTraining: '#earthWaterTraining',
            
            // 系统控制
            lastUpdated: '#lastUpdated',
            resetButton: '#resetButton',
            syncButton: '#syncButton'
        },
        storageKey: 'DHY-Upgrade-Assistant_v1',
        requiredExp: 2386300, // 所需总经验值
        
        // GitHub Gist配置 (请替换为您的信息)
        gist: {
            token: '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', // 有gist权限的GitHub个人访问令牌
            filename: 'dhy-upgrade-data.json', // 存储文件名
            gistId: null // 首次使用后会自动保存
        }
    };

    // ==================== 游戏数据 ====================
    const GAME_DATA = {
        // ... (保持原有的游戏数据不变) ...
    };

    // ==================== 状态管理 ====================
    let state = {};
    const dom = {}; // 缓存DOM元素

    // ==================== GitHub Gist API 函数 ====================

    /**
     * 创建或更新Gist
     */
    const updateGist = async (content) => {
        try {
            const { token, filename, gistId } = CONFIG.gist;
            const url = gistId ? 
                `https://api.github.com/gists/${gistId}` : 
                'https://api.github.com/gists';
            
            const response = await fetch(url, {
                method: gistId ? 'PATCH' : 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: '密探升级助手数据存储',
                    public: false,
                    files: {
                        [filename]: {
                            content: JSON.stringify(content)
                        }
                    }
                })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            // 如果是新创建的Gist，保存ID
            if (!gistId && data.id) {
                CONFIG.gist.gistId = data.id;
                localStorage.setItem('gistId', data.id);
            }
            
            return true;
        } catch (error) {
            console.error('Gist更新失败:', error);
            return false;
        }
    };

    /**
     * 从Gist获取数据
     */
    const fetchGist = async () => {
        try {
            const { token, filename, gistId } = CONFIG.gist;
            if (!gistId) return null;
            
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `token ${token}`
                }
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            const file = data.files[filename];
            if (!file) throw new Error('找不到数据文件');
            
            return JSON.parse(file.content);
        } catch (error) {
            console.error('Gist获取失败:', error);
            return null;
        }
    };

    // ==================== 核心函数 ====================

    /**
     * 初始化应用
     */
    const init = () => {
        console.log('🚀 密探资源系统启动(GitHub版)...');
        setupDOM();
        
        // 尝试从本地加载Gist ID
        const savedGistId = localStorage.getItem('gistId');
        if (savedGistId) CONFIG.gist.gistId = savedGistId;
        
        loadData().then(() => {
            setupEventListeners();
            renderAll();
        });
    };

    /**
     * 加载保存的数据
     */
    const loadData = async () => {
        try {
            // 1. 尝试从Gist加载
            const gistData = await fetchGist();
            
            // 2. 如果Gist没有数据，尝试从本地加载
            const localData = localStorage.getItem(CONFIG.storageKey);
            
            // 3. 合并数据源
            state = gistData || (localData ? JSON.parse(localData) : resetState());
            
            // 初始化历练状态（兼容旧版本数据）
            if (!state.training) {
                state.training = initTrainingState();
            }
            
            // 恢复时间戳显示
            if (state.lastUpdated) {
                updateTimestampDisplay();
            }
        } catch (e) {
            console.error('数据加载失败:', e);
            state = resetState();
        }
    };

    /**
     * 保存数据到GitHub Gist和本地
     */
    const saveData = async () => {
        try {
            // 1. 先保存到本地
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
            
            // 2. 尝试同步到Gist
            const syncSuccess = await updateGist(state);
            
            if (syncSuccess) {
                console.log('数据已同步到GitHub Gist');
                showSyncStatus('同步成功', 'success');
            } else {
                showSyncStatus('同步失败，使用本地存储', 'error');
            }
        } catch (e) {
            console.error('保存数据失败:', e);
            showSyncStatus('保存失败', 'error');
        }
    };

    /**
     * 显示同步状态
     */
    const showSyncStatus = (message, type = 'info') => {
        const statusEl = document.createElement('div');
        statusEl.className = `sync-status ${type}`;
        statusEl.textContent = message;
        
        if (dom.syncButton) {
            dom.syncButton.insertAdjacentElement('afterend', statusEl);
            setTimeout(() => statusEl.remove(), 3000);
        }
    };

    // ==================== 事件处理 ====================

    /**
     * 设置事件监听器
     */
    const setupEventListeners = () => {
        // ... (保持原有的事件监听不变) ...
        
        // 添加同步按钮事件
        if (dom.syncButton) {
            dom.syncButton.addEventListener('click', async () => {
                dom.syncButton.disabled = true;
                await saveData();
                dom.syncButton.disabled = false;
            });
        }
    };

    // ... (保持原有的其他函数不变) ...

    // 暴露初始化方法
    return { init };
})();

// 页面加载完成后
document.addEventListener('DOMContentLoaded', () => {
    // 检查浏览器是否支持所需API
    if (!('localStorage' in window)) {
        alert('您的浏览器不支持本地存储功能，部分功能将无法使用');
        return;
    }

    // 初始化资源追踪系统
    try {
        ResourceTracker.init();
        console.log('✅ 密探升级助手(GitHub版)初始化完成');
    } catch (error) {
        console.error('初始化失败:', error);
        alert('系统初始化失败，请刷新页面重试');
        setTimeout(() => location.reload(), 2000);
    }
});
