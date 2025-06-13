const ResourceTracker = (() => {
    // 配置项
    const config = {
        containerId: '#resourceTracker',
        elements: {
            classStatus: '#classStatus',
            materialsList: '#materials-list',
            moneyCheck: '#money-check',
            fragments: '#fragments',
            scrolls: '#scrolls',
            expStatus: '#exp-status',
            lastUpdated: '#lastUpdated',
            resetButton: '#resetButton'
        },
        storageKey: 'DHY-Upgrade-Assistant_v1',
        gistToken: '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', // GitHub个人访问令牌
        gistId: null, // 第一次运行时自动创建
        gistFilename: 'DHY-Upgrade-Assistant-data.json'
    };

    // 材料数据
    const materialsData = [
        // 80级突破材料
        { id: 'fujunhaitang', name: '【府君海棠】*30', class: '诡道' },
        { id: 'panlonggu', name: '【蟠龙鼓】*30', class: '神纪' },
        { id: 'yinwendao', name: '【银纹刀】*30', class: '岐黄' },
        { id: 'yuguidun', name: '【玉龟盾】*30', class: '龙盾' },
        { id: 'xijiaogong', name: '【犀角弓】*30', class: '破军' },
        // 70级突破材料
        { id: 'menghunlan', name: '【梦魂兰】*30', class: '诡道' },
        { id: 'zhentiangu', name: '【震天鼓】*30', class: '神纪' },
        { id: 'qingtongdao', name: '【青铜刀】*30', class: '岐黄' },
        { id: 'caiwendun', name: '【彩纹盾】*30', class: '龙盾' },
        { id: 'tietaigong', name: '【铁胎弓】*30', class: '破军' },
        // 通用升级材料
        { id: 'zuigucao', name: '【醉骨草】*30', class: '通用' },
        { id: 'qingtingyan', name: '【蜻蜓眼】*120', class: '通用' },
        { id: 'ziyunying', name: '【紫云英】*160', class: '通用' },
        { id: 'yingqiongyao', name: '【瑛琼瑶】*105', class: '通用' },
        { id: 'jincuodao', name: '【金错刀】*80', class: '通用' },
        { id: 'diguanghe', name: '【低光荷】*100', class: '通用' },
        { id: 'yuanyu', name: '【鸢羽】*40', class: '通用' },
        { id: 'jianjia', name: '【蒹葭】*494', class: '通用' }
    ];
    
    // 职业数据
    const classes = ['诡道', '神纪', '岐黄', '龙盾', '破军'];
    const requiredExp = 2386300; // 所需经验值
    
    const dom = {}; // DOM元素缓存
    let state = {}; // 应用状态

    // 格式化日期为中文显示
    const formatDate = (date) => {
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\//g, '-');
    };

    // 更新时间戳显示
    const updateTimestamp = () => {
        const now = new Date();
        state.lastUpdated = now.toISOString();
        dom.lastUpdated.textContent = `最近更新：${formatDate(now)}`;
    };

    // 计算经验值状态（不依赖DOM）
    const getExpStatus = () => {
        const currentExp = state.fragments * 100 + state.scrolls * 1000;
        return {
            isMet: currentExp >= requiredExp,
            text: currentExp >= requiredExp ? '已满足' : '未满足',
            className: currentExp >= requiredExp ? 'exp-status met' : 'exp-status not-met'
        };
    };

    // 初始化应用
    const init = () => {
        console.log('🚀 密探资源系统启动...');
        
        try {
            // 缓存DOM元素
            dom.container = document.querySelector(config.containerId);
            Object.entries(config.elements).forEach(([key, selector]) => {
                dom[key] = document.querySelector(selector);
            });

            // 加载数据后初始化
            loadData().then(() => {
                bindEvents();
                render();
            });
        } catch (error) {
            showError('系统初始化失败，请刷新页面');
            console.error('初始化错误:', error);
        }
    };
    
    // 加载保存的数据
    const loadData = async () => {
        try {
            // 尝试从GitHub Gist加载
            const savedGistId = localStorage.getItem('gistId');
            if (savedGistId) config.gistId = savedGistId;
            
            if (config.gistId && config.gistToken) {
                const response = await fetch(`https://api.github.com/gists/${config.gistId}`, {
                    headers: {
                        'Authorization': `token ${config.gistToken}`
                    }
                });
                
                const data = await response.json();
                if (data.files?.[config.gistFilename]) {
                    state = JSON.parse(data.files[config.gistFilename].content);
                }
            }
            
            // 回退到本地存储
            if (!state || Object.keys(state).length === 0) {
                const saved = localStorage.getItem(config.storageKey);
                state = saved ? JSON.parse(saved) : resetSystem();
            }

            // 恢复时间戳显示
            if (state.lastUpdated) {
                dom.lastUpdated.textContent = `最近更新：${formatDate(new Date(state.lastUpdated))}`;
            }
        } catch (e) {
            console.warn('数据加载失败:', e);
            const saved = localStorage.getItem(config.storageKey);
            state = saved ? JSON.parse(saved) : resetSystem();
        }
    };
    
    // 重置系统状态
    const resetSystem = () => {
        state = {
            moneyChecked: false,
            fragments: 0,
            scrolls: 0,
            materials: {},
            lastUpdated: new Date().toISOString()
        };
        
        // 初始化材料状态
        materialsData.forEach(material => {
            state.materials[material.id] = false;
        });
        
        return state;
    };

    // 绑定事件监听
    const bindEvents = () => {
        // 金钱复选框
        dom.moneyCheck.addEventListener('change', () => {
            state.moneyChecked = dom.moneyCheck.checked;
            updateTimestamp();
            saveAndRender();
        });
        
        // 兵书数量输入
        dom.fragments.addEventListener('input', () => {
            state.fragments = parseInt(dom.fragments.value) || 0;
            updateTimestamp();
            saveAndRender();
        });
        
        dom.scrolls.addEventListener('input', () => {
            state.scrolls = parseInt(dom.scrolls.value) || 0;
            updateTimestamp();
            saveAndRender();
        });
        
        // 材料复选框（事件委托）
        dom.materialsList.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const materialId = e.target.id.replace('-check', '');
                state.materials[materialId] = e.target.checked;
                updateTimestamp();
                saveAndRender();
            }
        });

        // 清空按钮
        dom.resetButton.addEventListener('click', () => {
            if (confirm('确定要清空所有记录吗？')) {
                resetSystem();
                updateTimestamp();
                saveAndRender();
            }
        });
    };

    // 渲染整个界面
    const render = () => {
        // 计算当前状态
        const expStatus = getExpStatus();
        const generalMaterials = materialsData.filter(m => m.class === '通用');
        const allGeneralMet = generalMaterials.every(m => state.materials[m.id]);
        const baseConditionsMet = state.moneyChecked && expStatus.isMet && allGeneralMet;

        // 更新DOM显示
        dom.expStatus.textContent = expStatus.text;
        dom.expStatus.className = expStatus.className;
        dom.moneyCheck.checked = state.moneyChecked;
        dom.fragments.value = state.fragments;
        dom.scrolls.value = state.scrolls;

        // 渲染职业状态
        dom.classStatus.innerHTML = classes.map(className => {
            const classMaterials = materialsData.filter(m => m.class === className);
            const allClassMaterialsMet = classMaterials.every(m => state.materials[m.id]);
            const isReady = baseConditionsMet && allClassMaterialsMet;
            
            return `
                <div class="class-row">
                    <div class="class-name">${className}</div>
                    <div class="class-indicator ${isReady ? 'ready' : 'pending'}">
                        ${isReady ? '可满级' : '待沉淀'}
                    </div>
                </div>
            `;
        }).join('');

        // 渲染材料列表
        dom.materialsList.innerHTML = materialsData.map(material => `
            <div class="resource-item">
                <div class="resource-name">${material.name}</div>
                <div class="checkbox-container">
                    <input type="checkbox" id="${material.id}-check" ${state.materials[material.id] ? 'checked' : ''}>
                </div>
            </div>
        `).join('');
    };

    // 保存并重新渲染
    const saveAndRender = () => {
        saveData();
        render();
    };

    // 保存数据到本地和GitHub
    const saveData = async () => {
        try {
            // 本地存储
            localStorage.setItem(config.storageKey, JSON.stringify(state));
            
            // GitHub Gist存储
            if (!config.gistToken) return;
            
            const url = config.gistId 
                ? `https://api.github.com/gists/${config.gistId}` 
                : 'https://api.github.com/gists';
                
            const response = await fetch(url, {
                method: config.gistId ? 'PATCH' : 'POST',
                headers: {
                    'Authorization': `token ${config.gistToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'Secret Agent Resources Data',
                    public: false,
                    files: {
                        [config.gistFilename]: {
                            content: JSON.stringify(state)
                        }
                    }
                })
            });
            
            // 保存Gist ID
            if (!config.gistId) {
                const data = await response.json();
                config.gistId = data.id;
                localStorage.setItem('gistId', data.id);
            }
        } catch (e) {
            console.error('保存失败:', e);
            localStorage.setItem(config.storageKey, JSON.stringify(state));
        }
    };

    // 显示错误信息
    const showError = (msg) => {
        dom.container.innerHTML = `
            <div class="error-box">
                ❗ ${msg}
                <button onclick="location.reload()">点击重试</button>
            </div>
        `;
    };

    return { init };
})();

// 页面加载完成后启动应用
document.addEventListener('DOMContentLoaded', ResourceTracker.init);
