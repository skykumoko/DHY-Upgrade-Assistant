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
                { name: '【历练·四】', required: 6, editable: true },
                { name: '【历练·六】', required: 12, editable: true },
                { name: '【历练·八】', required: 24, editable: true },
                { name: '【历练·十】', required: 35, editable: true },
                { name: '【历练·十二】', required: 47, editable: true }
            ],
            earthWater: [
                { name: '【历练·四】', required: 6, editable: true },
                { name: '【历练·六】', required: 12, editable: true },
                { name: '【历练·八】', required: 24, editable: true },
                { name: '【历练·十】', required: 35, editable: true },
                { name: '【历练·十二】', required: 47, editable: true }
            ],
            yinYang: [
                { name: '【历练·四】', required: 6, editable: true },
                { name: '【历练·六】', required: 12, editable: true },
                { name: '【历练·八】', required: 24, editable: true },
                { name: '【历练·十】', required: 35, editable: true },
                { name: '【历练·十二】', required: 47, editable: true }
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
        targetSelection: {
            classes: {
                guidao: false,
                shenji: false,
                qihuang: false,
                longdun: false,
                pojun: false
            },
            attributes: {
                yin: false,
                yang: false,
                feng: false,
                huo: false,
                di: false,
                shui: false
            }
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
        try {
            setupDOM();
            loadData();
            renderAll();
            setupEventListeners();
            console.log('✅ 初始化完成，当前状态:', JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('初始化过程中出错:', error);
            alert('系统初始化失败，请刷新页面重试');
        }
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
                
                // 初始化材料状态
                const materials = {};
                GAME_DATA.materials.forEach(material => {
                    materials[material.id] = parsed.materials?.[material.id] || false;
                });
                
                // 合并状态
                state = {
                    ...resetState(), // 获取默认状态
                    ...parsed,      // 覆盖保存的值
                    materials,      // 使用初始化后的材料状态
                    // 确保嵌套结构完整
                    targetSelection: parsed.targetSelection || resetState().targetSelection,
                    trainingHistory: parsed.trainingHistory || []
                };

                // 确保历练状态正确加载
                ['yinYang', 'windFire', 'earthWater'].forEach(category => {
                    if (parsed.training?.[category]) {
                        state.training[category] = parsed.training[category].map((item, i) => ({
                            completed: item.completed || 0,
                            required: item.required >= 0 ? item.required : GAME_DATA.training[category][i].required
                        }));
                    }
                });
            }
            updateLastUpdated();
        } catch (e) {
            console.error('数据加载失败:', e);
            // 如果加载失败，重置为默认状态
            state = resetState();
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
        renderTargetSelection(); // 先渲染目标选择
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
     * 目标密探元素
     */
    const renderTargetSelection = () => {
        const targetSection = document.querySelector('.target-section');
        if (!targetSection) {
            console.error('目标密探区域未找到');
            return;
        }
        
        // 更新所有复选框状态
        const checkboxes = targetSection.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const type = checkbox.dataset.type;
            const value = checkbox.dataset.value;
            checkbox.checked = type === 'class' 
                ? state.targetSelection.classes[value] 
                : state.targetSelection.attributes[value];
        });
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
            const trainingItem = state.training[category][index] || { completed: 0, required: item.required };
            const completed = trainingItem.completed;
            const required = Math.max(0, trainingItem.required);
            const isMet = completed >= required;
            const remaining = Math.max(0, required - completed);
    
            return `
                <div class="training-item">
                    <div class="training-header">
                        <div class="training-name">${item.name}</div>
                        <div class="training-input-status">
                            <input type="number" 
                                class="training-count-input" 
                                data-category="${category}" 
                                data-index="${index}"
                                value="${required}" 
                                min="0">
                            <div class="sub-status-indicator ${isMet ? 'met' : 'not-met'}">
                                ${isMet ? '已满足' : `${completed}/${required}`}
                            </div>
                        </div>
                    </div>
                    ${required > 0 ? renderCircles(required, completed) : ''}
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
                            ${completed <= 0 ? 'disabled' : ''}>
                            撤销
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };
    
    
    /**
     * 渲染圆圈进度 (自适应宽度布局)
     * @param {number} required 需要的总次数
     * @param {number} completed 已完成次数
     */
    const renderCircles = (required, completed) => {
        if (required <= 0) return '';
        
        // 创建单个圆圈HTML
        const createCircle = (index) => 
            `<div class="circle ${index < completed ? 'filled' : ''}"></div>`;

        // 生成所有圆圈
        let circlesHTML = '';
        for (let i = 0; i < required; i++) {
            circlesHTML += createCircle(i);
        }

        // 使用flex容器包裹（不再需要分行逻辑）
        return `
            <div class="circles-container">
                ${circlesHTML}
            </div>
        `;
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
    const handleConsume = (category, index, count = 1) => {
        const trainingItem = state.training[category][index];
        if (!trainingItem) return;
        
        const required = trainingItem.required;
        const current = trainingItem.completed || 0;
        const remaining = required - current;
        
        const actualCount = Math.min(count, remaining);
        if (actualCount <= 0) return;
        
        // 记录操作历史
        state.trainingHistory.push({
            category,
            index,
            previousCount: current,
            count: actualCount,
            timestamp: new Date().toISOString()
        });
        
        // 执行核销
        state.training[category][index].completed = current + actualCount;
        updateAndSave();
    };


    /**
     * 处理撤销操作
     */
    const handleUndo = (category, index) => {
        const trainingItem = state.training[category][index];
        if (!trainingItem || trainingItem.completed <= 0) return;
        
        // 找到最近一次操作
        const lastActionIndex = [...state.trainingHistory]
            .reverse()
            .findIndex(a => a.category === category && a.index === index);
        
        if (lastActionIndex !== -1) {
            const actualIndex = state.trainingHistory.length - 1 - lastActionIndex;
            const lastAction = state.trainingHistory[actualIndex];
            
            trainingItem.completed = lastAction.previousCount;
            state.trainingHistory.splice(actualIndex, 1);
            updateAndSave();
        }
    };

    // ==================== 事件处理 ====================

    /**
     * 设置事件监听器
     */
    const setupEventListeners = () => {
        // 目标选择变化监听
        document.addEventListener('change', (e) => {
            if (e.target.matches('.target-section input[type="checkbox"]')) {
                const checkbox = e.target;
                const type = checkbox.dataset.type;
                const value = checkbox.dataset.value;
                
                if (type === 'class') {
                    state.targetSelection.classes[value] = checkbox.checked;
                } else if (type === 'attribute') {
                    state.targetSelection.attributes[value] = checkbox.checked;
                }
                
                updateAndSave();
            }
        });

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
                const { category, index, count } = e.target.dataset;
                handleConsume(category, parseInt(index), parseInt(count) || 1);
                return;
            }
            
            // 撤销按钮
            if (e.target.classList.contains('undo-btn')) {
                const { category, index } = e.target.dataset;
                handleUndo(category, parseInt(index));
                return;
            }
        });

        // 历练次数输入框
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('training-count-input')) {
                const input = e.target;
                const category = input.dataset.category;
                const index = parseInt(input.dataset.index);
                const newValue = Math.max(0, parseInt(input.value) || 0); 
                
                state.training[category][index].required = newValue;
                renderTraining();
                
                clearTimeout(window.saveTimeout);
                window.saveTimeout = setTimeout(() => {
                    updateAndSave();
                }, 300);
            }
        });
            
        // 重置按钮
        dom.resetButton.addEventListener('click', () => {
            if (confirm('确定要清空所有记录吗？')) {
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
            // 保存完整状态
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
        
        // 初始化历练状态
        const initTraining = (category) => 
            GAME_DATA.training[category].map(item => ({
                completed: 0,
                required: item.required || 1
            }));

        // 返回全新状态对象
        return {
            moneyChecked: false,
            fragments: 0,
            scrolls: 0,
            materials,
            training: {
                yinYang: initTraining('yinYang'),
                windFire: initTraining('windFire'),
                earthWater: initTraining('earthWater')
            },
            targetSelection: {
                classes: Object.fromEntries(
                    GAME_DATA.classes.map(cls => [getClassKey(cls), false])
                ),
                attributes: {
                    yin: false,
                    yang: false,
                    feng: false,
                    huo: false,
                    di: false,
                    shui: false
                }
            },
            trainingHistory: [],
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

