// File: js/simpleTextEditor.js
import { app } from "../../../scripts/app.js";

class SimpleTextEditorNodeHelper {
    constructor(node) {
        this.node = node;
        this.node.simpleTextEditor = this;

        this.node.properties = this.node.properties || {};

        let initialAutoSyncValue = false; // Default fallback
        if (this.node.properties.auto_sync !== undefined) {
            initialAutoSyncValue = this.node.properties.auto_sync;
        } else {
            const widgetInfo = node.constructor.nodeData?.input?.required?.auto_sync;
            if (widgetInfo && widgetInfo[1]?.default !== undefined) {
                initialAutoSyncValue = widgetInfo[1].default;
            }
        }
        this.isAutoSync = initialAutoSyncValue;

        if (this.node.properties.auto_sync === undefined) {
            this.node.properties.auto_sync = this.isAutoSync;
        }

        this.last_input_string_from_exec = "";
        this.isDirty = false;

        this.setupWidgets();
        this.bindEvents();
        this.applyStyles();

        this.node.widgets[1].hidden = true; 
    }

    setupWidgets() {
        setTimeout(() => {
            this.textWidget = this.node.widgets.find(w => w.name === "text_content");
            this.autoSyncWidget = this.node.widgets.find(w => w.name === "auto_sync");

            if (this.textWidget) {
                if (this.textWidget.inputEl) {
                    this.textWidget.inputEl.style.width = "100%";
                    this.textWidget.inputEl.style.height = "100%";
                    this.textWidget.inputEl.style.boxSizing = "border-box";
                    this.textWidget.inputEl.style.overflowY = "auto";
                    this.textWidget.inputEl.style.resize = "none";
                    this.textWidget.inputEl.style.minHeight = "80px";
                    this.textWidget.inputEl.style.marginBottom = "0";
                }
                
            this.textWidget.inputEl.addEventListener('input', () => {
                if (this.isAutoSync) {
                    this.isAutoSync = false;
                    this.node.properties.auto_sync = false;

                    if (this.autoSyncWidget && this.autoSyncWidget.value !== false) {
                        this.autoSyncWidget.value = false;
                    }

                    this.updateTabButtonStates();
                }

                this.checkDirty();
                });

                const originalTextCallback = this.textWidget.callback;
                this.textWidget.callback = (value) => {
                    if (originalTextCallback) {
                        originalTextCallback.call(this.textWidget, value);
                    }
                    this.checkDirty();
                };
            } else {
                console.warn("SimpleTextEditorNode: 'text_content' widget not found.");
            }

            if (this.autoSyncWidget) {
                if (this.autoSyncWidget.value !== this.isAutoSync) {
                    this.autoSyncWidget.value = this.isAutoSync;
                }
                 if (this.node.properties.auto_sync !== this.isAutoSync) {
                    this.node.properties.auto_sync = this.isAutoSync;
                 }


                const originalAutoSyncCallback = this.autoSyncWidget.callback;
                this.autoSyncWidget.callback = (value) => { 
                    if (originalAutoSyncCallback) {
                        originalAutoSyncCallback.call(this.autoSyncWidget, value);
                    }
                    
                    if (this.isAutoSync !== value) {
                        this.isAutoSync = value;
                        this.updateTabButtonStates(); 
                    }
                    this.checkDirty(); 
                };
                
                if (this.autoSyncWidget.element) {
                    this.autoSyncWidget.element.style.display = "none";
                }
            } else {
                console.warn("SimpleTextEditorNode: 'auto_sync' widget not found.");
            }
            
            this.createTabButtons();
            
            setTimeout(() => {
                if (this.textWidget && this.node.properties.text_content !== undefined) {
                    if (this.textWidget.value !== this.node.properties.text_content) {
                       this.textWidget.value = this.node.properties.text_content;
                    }
                    if (this.textWidget.inputEl && this.textWidget.inputEl.value !== this.node.properties.text_content) {
                        this.textWidget.inputEl.value = this.node.properties.text_content;
                    }
                }
                
                this.updateTabButtonStates();
                this.checkDirty();
            }, 50);

        }, 0);
    }
    
    createTabButtons() {
        setTimeout(() => {
            if (!this.textWidget || !this.textWidget.inputEl) return;
            
            const tabContainer = document.createElement('div');
            tabContainer.className = 'text-editor-tab-container';
            tabContainer.style.cssText = `
                display: flex;
                margin-top: 0;
                overflow: hidden;
                max-width: 80%;
                margin: 0 auto;
            `;
            
            this.autoSyncTab = document.createElement('div');
            this.autoSyncTab.className = 'text-editor-tab';
            this.autoSyncTab.textContent = 'Auto Sync';
            this.autoSyncTab.style.cssText = `
                flex: 1;
                text-align: center;
                padding: 4px 0;
                font-size: 12px;
                cursor: pointer;
                user-select: none;
                background-color:rgb(34, 34, 34);
                color: #aaaaaa;
                border-right: 1px solid #444444;
                border-bottom-left-radius: 8px;
                transition: background-color 0.2s, color 0.2s;
                height: 18px;
            `;
            
            this.manualSyncTab = document.createElement('div');
            this.manualSyncTab.className = 'text-editor-tab';
            this.manualSyncTab.textContent = 'Sync';
            this.manualSyncTab.style.cssText = `
                flex: 1;
                text-align: center;
                padding: 4px 0;
                font-size: 12px;
                cursor: pointer;
                user-select: none;
                background-color: rgb(34, 34, 34);
                color: #aaaaaa;
                border-bottom-right-radius: 8px;
                transition: background-color 0.2s, color 0.2s;
                height: 18px;
            `;
            
            this.autoSyncTab.addEventListener('click', () => {
                this.toggleAutoSync();
            });
            
            this.manualSyncTab.addEventListener('click', () => {
                this.performManualSync();
            });
            
            tabContainer.appendChild(this.autoSyncTab);
            tabContainer.appendChild(this.manualSyncTab);
            
            const textWidgetParent = this.textWidget.inputEl.parentElement;
            if (textWidgetParent) {
                textWidgetParent.insertBefore(tabContainer, this.textWidget.inputEl.nextSibling);
            }
            
            if (this.textWidget.inputEl) {
                this.textWidget.inputEl.style.borderBottomLeftRadius = "0";
                this.textWidget.inputEl.style.borderBottomRightRadius = "0";
                this.textWidget.inputEl.style.marginBottom = "0";
            }
            
            this.updateTabButtonStates(); // Set initial visual state of tabs
        }, 10);
    }
    
    toggleAutoSync() {
        this.isAutoSync = !this.isAutoSync;

        this.node.properties.auto_sync = this.isAutoSync;

        if (this.autoSyncWidget) {
            this.autoSyncWidget.value = this.isAutoSync;
        }
        
        this.updateTabButtonStates();
        this.checkDirty();
    }

    updateTabButtonStates() {
        if (!this.autoSyncTab || !this.manualSyncTab) return;
        
        if (this.isAutoSync) {
            this.autoSyncTab.style.backgroundColor = '#2c5f2d'; // Active green
            this.autoSyncTab.style.color = '#ffffff';
        } else {
            this.autoSyncTab.style.backgroundColor = 'rgb(34, 34, 34)'; // Default dark
            this.autoSyncTab.style.color = '#aaaaaa';
        }
        
        if (!this.isDirty && this.manualSyncTab.style.color === '#fbbf24') { // yellow-500
            this.manualSyncTab.style.color = '#aaaaaa';
        }
    }

    applyStyles() {
        const styleTag = document.createElement('style');
        styleTag.textContent = `
            .simple-text-editor-textbox {
                border-radius: 8px !important;
                border: 1px solid #4b5563 !important;
                padding: 8px !important;
                font-family: monospace !important;
                transition: border-color 0.2s !important;
                outline: none !important;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                margin-bottom: 0 !important;
            }
            .simple-text-editor-textbox:focus {
                border-color: #6b7280 !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
            }
            .simple-text-editor-textbox-dirty {
                border-left: 2px solid #fbbf24 !important; /* yellow-500 */
                border-right: 2px solid #fbbf24 !important; /* yellow-500 */
            }
            .simple-text-editor-textbox::-webkit-scrollbar { width: 8px !important; }
            .simple-text-editor-textbox::-webkit-scrollbar-track { background: transparent !important; }
            .simple-text-editor-textbox::-webkit-scrollbar-thumb {
                background-color: #666666 !important;
                border-radius: 20px !important;
                border: 2px solid #333333 !important;
            }
            .simple-text-editor-textbox::-webkit-scrollbar-thumb:hover { background-color: #888888 !important; }
            .text-editor-tab:hover { background-color: #444444 !important; }
            .text-editor-tab.active { /* This class is not currently used, style directly by isAutoSync */
                background-color: #2c5f2d !important;
                color: white !important;
            }
            .text-editor-tab.active:hover { background-color: #3a7a3b !important; }
            .text-editor-tab-container {
                max-width: 80% !important;
                margin: 0 auto !important;
            }
            .litegraph.litecontextmenu { z-index: 10000 !important; }
        `;
        document.head.appendChild(styleTag);
        
        setTimeout(() => {
            if (this.textWidget && this.textWidget.inputEl) {
                this.textWidget.inputEl.style.marginBottom = "0";
            }
        }, 100);
    }

    bindEvents() {
        const originalOnExecuted = this.node.onExecuted;
        this.node.onExecuted = (message) => {
            if (originalOnExecuted) {
                originalOnExecuted.apply(this.node, arguments);
            }
            
            const nodeHelper = this.node.simpleTextEditor;
            if (!nodeHelper) return;

            if (message) {
                if (message.text_from_input_executed && message.text_from_input_executed.length > 0) {
                    nodeHelper.last_input_string_from_exec = message.text_from_input_executed[0] === null ? "" : message.text_from_input_executed[0];
                }
                if (message.text_widget_should_be && message.text_widget_should_be.length > 0) {
                    const newText = message.text_widget_should_be[0];
                    if (nodeHelper.textWidget) {
                        if (nodeHelper.textWidget.inputEl) nodeHelper.textWidget.inputEl.value = newText;
                        if (nodeHelper.textWidget.value !== newText) nodeHelper.textWidget.value = newText;
                        if (nodeHelper.node.properties.text_content !== newText) nodeHelper.node.properties.text_content = newText;
                    }
                }
            }
            nodeHelper.checkDirty();
            nodeHelper.node.setDirtyCanvas(true, true);
        };

        const originalOnPropertyChanged = this.node.onPropertyChanged;
        this.node.onPropertyChanged = (name, value) => {
            if (originalOnPropertyChanged) {
                originalOnPropertyChanged.apply(this.node, arguments);
            }

            const nodeHelper = this.node.simpleTextEditor;
            if (!nodeHelper) return;

            if (name === "text_content") {
                if (nodeHelper.textWidget && nodeHelper.textWidget.value !== value) {
                    nodeHelper.textWidget.value = value;
                    if (nodeHelper.textWidget.inputEl) nodeHelper.textWidget.inputEl.value = value;
                }
                nodeHelper.checkDirty();
            } else if (name === "auto_sync") {
                if (nodeHelper.isAutoSync !== value) {
                    nodeHelper.isAutoSync = value;
                    nodeHelper.updateTabButtonStates();
                }
                if (nodeHelper.autoSyncWidget && nodeHelper.autoSyncWidget.value !== value) {
                    nodeHelper.autoSyncWidget.value = value;
                }
                nodeHelper.checkDirty();
            }
        };
    }

    performManualSync() {
        if (!this.textWidget) return;
        const textToSync = this.last_input_string_from_exec;

        if (this.textWidget.inputEl) this.textWidget.inputEl.value = textToSync;
        if (this.textWidget.value !== textToSync) this.textWidget.value = textToSync;
        if (this.node.properties.text_content !== textToSync) this.node.properties.text_content = textToSync;
        
        if (this.manualSyncTab) {
            const originalColor = this.manualSyncTab.style.backgroundColor;
            this.manualSyncTab.style.backgroundColor = '#4a5f8d'; // Blue flash
            setTimeout(() => { this.manualSyncTab.style.backgroundColor = originalColor; }, 300);
        }
        
        this.checkDirty();
        this.node.setDirtyCanvas(true, true);
    }

    checkDirty() {
        if (!this.textWidget || !this.textWidget.inputEl) return;

        const currentTextboxValue = this.textWidget.inputEl.value;
        const isDifferentFromLastInput = currentTextboxValue !== this.last_input_string_from_exec;
        this.isDirty = isDifferentFromLastInput;

        this.textWidget.inputEl.classList.add('simple-text-editor-textbox');
        if (isDifferentFromLastInput) {
            this.textWidget.inputEl.classList.add('simple-text-editor-textbox-dirty');
            this.textWidget.inputEl.title = "Content differs from the last executed input string. Manual Sync or Auto Sync on next run may apply.";
        } else {
            this.textWidget.inputEl.classList.remove('simple-text-editor-textbox-dirty');
            this.textWidget.inputEl.title = "";
        }
        
        if (this.manualSyncTab) {
            if (isDifferentFromLastInput) {
                this.manualSyncTab.style.color = '#fbbf24'; // yellow-500, Highlight text
            } else {
                this.manualSyncTab.style.color = '#aaaaaa'; // Reset to default
            }
        }
    }
}

app.registerExtension({
    name: "Comfy.SyncTextEditorNode",
    async beforeRegisterNodeDef(nodeType, nodeData, appInstance) {
        if (nodeData.name === "SyncTextEditor") {      
            nodeType.prototype.computeSize = () => [200, 150];

            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                new SimpleTextEditorNodeHelper(this);
                return r;
            };
        }
    },
});