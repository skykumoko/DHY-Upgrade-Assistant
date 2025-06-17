/**
 * 密探升级助手 - 资源追踪系统
 * 功能：追踪升级材料、历练进度和属性状态
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
            fragments: '#bingshu_canjuan',
            scrolls: '#bingshu_quanjuan',
            expStatus: '#exp-status',
            
            // 历练相关
            yinYangTraining: '#yinYangTraining',
            windFireTraining: '#windFireTraining',
            earthWaterTraining: '#earthWaterTraining',
            
            // 系统控制
            lastUpdated: '#lastUpdated',
            resetButton: '#resetButton'
        },
        storageKey: 'DHY-Upgrade-Assistant_v1',
        requiredExp: 2386300 // 所需总经验值
    };

    // ==================== 游戏数据 ====================
    const GAME_DATA = {
        // 职业列表
        classes: ['诡道', '神纪', '岐黄', '龙盾', '破军'],
        
        // 属性列表
        attributes: ['阴', '阳', '风', '火', '地', '水'],
        
        // 所有材料数据
        materials: [
            // 80级突破材料
            { id: 'fujunhaitang', name: '【府君海棠】*30', class: '诡道', level: 'gold' },
            { id: 'panlonggu', name: '【蟠龙鼓】*30', class: '神纪', level: 'gold' },
            { id: 'yinwendao', name: '【银纹刀】*30', class: '岐黄', level: 'gold' },
            { id: 'yuguidun', name: '【玉龟盾】*30', class: '龙盾', level: 'gold' },
            { id: 'xijiaogong', name: '【犀角弓】*30', class: '破军', level: 'gold' },
            
            // 70级突破材料
            { id: 'menghunlan', name: '【梦魂兰】*30', class: '诡道', level: 'purple' },
            { id: 'zhentiangu', name: '【震天鼓】*30', class: '神纪', level: 'purple' },
            { id: 'qingtongdao', name: '【青铜刀】*30', class: '岐黄', level: 'purple' },
            { id: 'caiwendun', name: '【彩纹盾】*30', class: '龙盾', level: 'purple' },
            { id: 'tietaigong', name: '【铁胎弓】*30', class: '破军', level: 'purple' },
            
            // 通用升级材料
            { id: 'zuigucao', name: '【醉骨草】*30', class: '通用', level: 'purple' },
            { id: 'qingtingyan', name: '【蜻蜓眼】*120', class: '通用', level: 'blue' },
            { id: 'ziyunying', name: '【紫云英】*160', class: '通用', level: 'blue' },
            { id: 'yingqiongyao', name: '【瑛琼瑶】*105', class: '通用', level: 'blue' },
            { id: 'jincuodao', name: '【金错刀】*80', class: '通用', level: 'blue' },
            { id: 'diguanghe', name: '【低光荷】*100', class: '通用', level: 'blue' },
            { id: 'yuanyu', name: '【鸢羽】*40', class: '通用', level: 'blue' },
            { id: 'jianjia', name: '【蒹葭】*494', class: '通用', level: 'blue' },
        ],
        
        // 历练配置
        training: {
            windFire: [
                { name: '【历练 · 四】', required: 6 },
                { name: '【历练 · 六】', required: 12 },
                { name: '【历练 · 八】', required: 24 },
                { name: '【历练 · 十】', required: 35 },
                { name: '【历练 · 十二】', required: 47 }
            ],
            earthWater: [
                { name: '【历练 · 四】', required: 6 },
                { name: '【历练 · 六】', required: 12 },
                { name: '【历练 · 八】', required: 24 },
                { name: '【历练 · 十】', required: 35 },
                { name: '【历练 · 十二】', required: 47 }
            ],
            yinYang: [
                { name: '【历练 · 四】', required: 6 },
                { name: '【历练 · 六】', required: 12 },
                { name: '【历练 · 八】', required: 24 },
                { name: '【历练 · 十】', required: 35 },
                { name: '【历练 · 十二】', required: 47 }
            ],
        }
    };

    // ==================== 状态管理 ====================
    let state = {
        moneyChecked: false,
        fragments: 0,
        scrolls: 0,
        materials: {},
        training: {
            yinYang: Array(5).fill().map(() => ({ completed: 0 })),
            windFire: Array(5).fill().map(() => ({ completed: 0 })),
            earthWater: Array(5).fill().map(() => ({ completed: 0 }))
        },
        trainingHistory: [], // 核销操作历史记录
        lastUpdated: null
    };
    const dom = {}; // 缓存DOM元素

    // ==================== 核心函数 ====================

    /**
     * 初始化应用
     */
    const init = () => {
        console.log('🚀 密探资源系统启动...');
        setupDOM();
        loadData();
        setupEventListeners();
        renderAll();
    };

    /**
     * 缓存DOM元素
     */
    const setupDOM = () => {
        dom.container = document.querySelector(CONFIG.containerId);
        Object.entries(CONFIG.elements).forEach(([key, selector]) => {
            dom[key] = document.querySelector(selector);
        });
    };

    /**
     * 加载保存的数据
     */
    const loadData = () => {
        try {
            const saved = localStorage.getItem(CONFIG.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // 合并状态，保留新添加的trainingHistory字段
                state = {
                    ...state,
                    ...parsed,
                    trainingHistory: parsed.trainingHistory || []
                };
                console.log('已加载保存的数据');
            }
            updateLastUpdated();
        } catch (e) {
            console.error('数据加载失败:', e);
        }
    };

    // ==================== 渲染函数 ====================

    /**
     * 渲染整个界面
     */
    const renderAll = () => {
        const expStatus = calculateExpStatus();
        const baseConditionsMet = checkBaseConditions(expStatus);
        
        updateBasicUI(expStatus);
        renderClassStatus(baseConditionsMet);
        renderMaterials();
        renderTraining();
    };

    /**
     * 更新基础UI元素
     */
    const updateBasicUI = (expStatus) => {
        dom.expStatus.textContent = expStatus.text;
        dom.expStatus.className = expStatus.className;
        dom.moneyCheck.checked = state.moneyChecked;
        dom.fragments.value = state.fragments;
        dom.scrolls.value = state.scrolls;
    };

    /**
     * 渲染职业状态
     */
    const renderClassStatus = (baseConditionsMet) => {
        dom.classStatus.innerHTML = GAME_DATA.classes.map(className => {
          const isReady = checkClassReady(className, baseConditionsMet);
          const classKey = getClassKey(className);
          return `
            <div class="status-item ${classKey}">
              <span>${className}</span>
              <span class="status-indicator ${isReady ? 'ready' : 'pending'}">
                ${isReady ? '可满级' : '待沉淀'}
              </span>
            </div>
          `;
        }).join('');
    };
    
    /**
     * 渲染属性状态
     */
    const renderAttributeStatus = () => {
        dom.attributeStatus.innerHTML = GAME_DATA.attributes.map(attr => {
          const isReady = checkTrainingComplete(
            attr === '阴' || attr === '阳' ? 'yinYang' :
            attr === '风' || attr === '火' ? 'windFire' : 'earthWater'
          );
          // 确保这里生成的类名与CSS匹配
          const attrClass = attr === '阴' ? 'yin' : 
                           attr === '阳' ? 'yang' :
                           attr === '风' ? 'feng' :
                           attr === '火' ? 'huo' :
                           attr === '地' ? 'di' : 'shui';
          
          return `
            <div class="status-item ${attrClass}">
              <span>${attr}</span>
              <span class="status-indicator ${isReady ? 'ready' : 'pending'}">
                ${isReady ? '可满级' : '待沉淀'}
              </span>
            </div>
          `;
        }).join('');
    };
    

    /**
     * 创建状态行HTML
     */
    const createStatusRow = (name, isReady, type = 'class') => {
        const indicatorClass = isReady ? 'ready' : 'pending';
        const text = isReady ? '可满级' : '待沉淀';
        
        return `
            <div class="status-row ${type}-row">
                <div class="${type}-name">${name}</div>
                <div class="status-indicator ${indicatorClass}">${text}</div>
            </div>
        `;
    };

    const getClassKey = (className) => {
        const map = {
          '诡道': 'guidao',
          '神纪': 'shenji',
          '岐黄': 'qihuang',
          '龙盾': 'longdun',
          '破军': 'pojun'
        };
        return map[className] || '';
    };
    
    /**
     * 渲染材料列表
     */
    const renderMaterials = () => {
        dom.materialsList.innerHTML = GAME_DATA.materials.map(material => {
            const checked = state.materials[material.id] ? 'checked' : '';
            return `
                <div class="resource-item ${material.level || 'blue'}">
                    <div class="resource-name">${material.name}</div>
                    <div class="checkbox-container">
                        <input type="checkbox" id="${material.id}-check" ${checked}>
                        <label for="${material.id}-check" class="material-checkbox"></label>
                    </div>
                </div>
            `;
        }).join('');
    };


    /**
     * 渲染所有历练类别
     */
    const renderTraining = () => {
        renderTrainingCategory('yinYang', dom.yinYangTraining);
        renderTrainingCategory('windFire', dom.windFireTraining);
        renderTrainingCategory('earthWater', dom.earthWaterTraining);
        renderAttributeStatus();
    };

    /**
     * 渲染单个历练类别
     */
    const renderTrainingCategory = (category, container) => {
        container.innerHTML = GAME_DATA.training[category].map((item, index) => {
            const trainingItem = state.training[category][index];
            const completed = trainingItem.completed || 0;
            const isMet = completed >= item.required;
            
            // 计算该项目是否有可撤销的历史记录
            const hasHistory = state.trainingHistory.some(action => 
                action.category === category && 
                action.index == index
            );
            
            // 计算剩余可核销次数（不超过需求次数）
            const remaining = Math.max(0, item.required - completed);
            
            return `
                <div class="training-item">
                    <div class="training-header">
                        <div class="training-name">${item.name}*${item.required}次</div>
                        <div class="sub-status-indicator ${isMet ? 'met' : 'not-met'}">
                            ${isMet ? '已满足' : `${completed}/${item.required}`}
                        </div>
                    </div>
                    ${renderCircles(item.required, completed)}
                    <div class="training-actions">
                        <button class="consume-btn" 
                            data-category="${category}" 
                            data-index="${index}" 
                            data-count="1"
                            ${isMet ? 'disabled' : ''}>
                            核销一次
                        </button>
                        <button class="consume-btn" 
                            data-category="${category}" 
                            data-index="${index}" 
                            data-count="3"
                            ${isMet || remaining < 3 ? 'disabled' : ''}>
                            核销三次
                        </button>
                        <button class="consume-btn" 
                            data-category="${category}" 
                            data-index="${index}" 
                            data-count="6"
                            ${isMet || remaining < 6 ? 'disabled' : ''}>
                            核销六次
                        </button>
                        <button class="undo-btn" 
                            data-category="${category}" 
                            data-index="${index}"
                            ${!hasHistory ? 'disabled' : ''}>
                            撤销
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };



    

    /**
     * 渲染圆圈进度 (严格按required数量显示)
     * @param {number} required 需要的总次数
     * @param {number} completed 已完成次数
     */
    const renderCircles = (required, completed) => {
        let html = '<div class="circles-container">';
        
        // 严格按required数量显示圆圈（不再有最小12个的限制）
        const totalCircles = required;
        
        // 计算行数（每行6个圆圈）
        const rows = Math.ceil(totalCircles / 6);
        
        for (let row = 0; row < rows; row++) {
            html += '<div class="circles-row">';
            const circlesInRow = Math.min(6, totalCircles - row * 6);
            
            for (let i = 0; i < circlesInRow; i++) {
                const circleIndex = row * 6 + i;
                const isFilled = circleIndex < completed;
                html += `<div class="circle ${isFilled ? 'filled' : ''}"></div>`;
            }
            html += '</div>';
        }
        
        return html + '</div>';
    };


    // ==================== 状态计算 ====================

    /**
     * 计算经验值状态
     */
    const calculateExpStatus = () => {
        const currentExp = state.fragments * 100 + state.scrolls * 1000;
        const isMet = currentExp >= CONFIG.requiredExp;
        return {
            isMet,
            text: isMet ? '已满足' : '未满足',
            className: `sub-status-indicator ${isMet ? 'met' : 'not-met'}`
        };
    };
    

    /**
     * 检查基础条件是否满足
     */
    const checkBaseConditions = (expStatus) => {
        const generalMaterials = GAME_DATA.materials.filter(m => m.class === '通用');
        const allGeneralMet = generalMaterials.every(m => state.materials[m.id]);
        return state.moneyChecked && expStatus.isMet && allGeneralMet;
    };

    /**
     * 检查职业是否就绪
     */
    const checkClassReady = (className, baseConditionsMet) => {
        const classMaterials = GAME_DATA.materials.filter(m => m.class === className);
        return baseConditionsMet && classMaterials.every(m => state.materials[m.id]);
    };

    /**
     * 检查历练是否全部完成
     */
    const checkTrainingComplete = (category) => {
        return state.training[category].every((item, i) => 
            item.completed >= GAME_DATA.training[category][i].required
        );
    };

    // ==================== 操作处理 ====================

    /**
     * 处理核销操作
     */
    const handleConsume = (category, index) => {
        // 记录操作历史
        state.trainingHistory.push({
            category,
            index,
            previousCount: state.training[category][index].completed,
            timestamp: new Date().toISOString()
        });
        
        // 限制历史记录数量
        if (state.trainingHistory.length > 50) {
            state.trainingHistory.shift();
        }
        
        // 执行核销
        state.training[category][index].completed++;
        updateAndSave();
    };

    /**
     * 处理撤销操作
     */
    const handleUndo = (category, index) => {
        if (state.trainingHistory.length === 0) return;
        
        // 找到该category和index的最新记录
        const lastActionIndex = [...state.trainingHistory].reverse()
            .findIndex(action => 
                action.category === category && 
                action.index == index  // 注意宽松相等，确保类型匹配
            );
        
        if (lastActionIndex === -1) return;
        
        // 计算实际索引
        const actualIndex = state.trainingHistory.length - 1 - lastActionIndex;
        const lastAction = state.trainingHistory[actualIndex];
        
        // 恢复状态
        state.training[category][index].completed = lastAction.previousCount;
        
        // 移除这条历史记录
        state.trainingHistory.splice(actualIndex, 1);
        
        updateAndSave();
    };

    // ==================== 事件处理 ====================

    /**
     * 设置事件监听器
     */
    const setupEventListeners = () => {
        // 金钱复选框
        dom.moneyCheck.addEventListener('change', () => {
            state.moneyChecked = dom.moneyCheck.checked;
            updateAndSave();
        });
        
        // 兵书数量输入
        document.getElementById('bingshu_canjuan').addEventListener('input', () => {
            state.fragments = parseInt(dom.fragments.value) || 0;
            updateAndSave();
        });
        
        document.getElementById('bingshu_quanjuan').addEventListener('input', () => {
            state.scrolls = parseInt(dom.scrolls.value) || 0;
            updateAndSave();
        });
        
        // 材料复选框（事件委托）
        dom.materialsList.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const materialId = e.target.id.replace('-check', '');
                state.materials[materialId] = e.target.checked;
                updateAndSave();
            }
        });

        // 历练操作按钮（事件委托）
        document.addEventListener('click', (e) => {
            // 核销按钮
            if (e.target.classList.contains('consume-btn')) {
                const { category, index } = e.target.dataset;
                handleConsume(category, index);
            }
            
            // 撤销按钮 - 注意检查class名是否匹配
            if (e.target.classList.contains('undo-btn')) {
                const { category, index } = e.target.dataset;
                handleUndo(category, index); // 确保调用了这个函数
            }
        });

        // 重置按钮
        dom.resetButton.addEventListener('click', () => {
            if (confirm('确定要清空所有记录吗？')) {
                // 重置状态但保留历史记录
                const newState = {
                    ...resetState(),
                    trainingHistory: state.trainingHistory
                };
                state = newState;
                updateAndSave();
            }
        });
    };

    // ==================== 工具函数 ====================

    /**
     * 更新并保存数据
     */
    const updateAndSave = () => {
        state.lastUpdated = new Date().toISOString();
        updateLastUpdated();
        saveData();
        renderAll();
    };

    /**
     * 更新时间戳显示
     */
    const updateLastUpdated = () => {
        if (state.lastUpdated && dom.lastUpdated) {
            const date = new Date(state.lastUpdated);
            dom.lastUpdated.textContent = `最近更新：${formatDate(date)}`;
        }
    };

    /**
     * 格式化日期显示
     */
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

    /**
     * 保存数据到本地存储
     */
    const saveData = () => {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    };

    /**
     * 重置状态
     */
    const resetState = () => {
        // 初始化材料状态
        const materials = {};
        GAME_DATA.materials.forEach(material => {
            materials[material.id] = false;
        });

        // 返回全新状态对象
        return {
            moneyChecked: false,
            fragments: 0,
            scrolls: 0,
            materials: materials,
            training: {
                yinYang: Array(5).fill().map(() => ({ completed: 0 })),
                windFire: Array(5).fill().map(() => ({ completed: 0 })),
                earthWater: Array(5).fill().map(() => ({ completed: 0 }))
            },
            trainingHistory: [], // 清空操作历史
            lastUpdated: new Date().toISOString()
        };
    };

    // ==================== 公共接口 ====================
    return { init };
})();

// ==================== 页面初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 检查浏览器是否支持所需API
    if (!('localStorage' in window)) {
        alert('您的浏览器不支持本地存储功能，部分功能将无法使用');
        return;
    }

    // 初始化资源追踪系统
    try {
        ResourceTracker.init();
        console.log('✅ 密探升级助手初始化完成');
    } catch (error) {
        console.error('初始化失败:', error);
        alert('系统初始化失败，请刷新页面重试');
        
        // 尝试恢复系统
        setTimeout(() => {
            location.reload();
        }, 200000);
    }
});

