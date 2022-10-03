/*jshint esversion: 6*/
/*jshint asi: true*/

"use strict"

/* jshint ignore:start */
const sendFetch = async (method, path, body, callback, returnerror) => {
    try {
        let response = Response;
        switch (method.toLowerCase()) {
            case "get":
                response = await fetch(path, {
                    credentials: 'same-origin',
                    method: 'GET'
                });
                break;
            case "post":
                response = await fetch(path, {
                    credentials: 'same-origin',
                    method: 'POST',
                    body: body
                }); 
                break;
            default:
                throw("bad method to fetch");
        }
        if (response.ok && response.status === 200) {
            const elements = await response.json();
            if(callback) {
                return callback(elements);
            }
            return elements;
        } else {
            throw(await response.text());
        }
    } catch (err) {
        if(returnerror) {
            return returnerror(err);
        }
    }
};
/* jshint ignore:end */

//getStyle - необхідний для пошуку розміру робочої області для розміщення таблиці
const getStyle = (el, styleProp) => {
    let value, defaultView = (el.ownerDocument || document).defaultView;
    // W3C standard way:
    if (defaultView && defaultView.getComputedStyle) {
        // sanitize property name to css notation
        // (hypen separated words eg. font-Size)
        styleProp = styleProp.replace(/([A-Z])/g, "-$1").toLowerCase();
        return defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
    } else if (el.currentStyle) { // IE
        // sanitize property name to camelCase
        styleProp = styleProp.replace(/\-(\w)/g, function(str, letter) {
            return letter.toUpperCase();
        });
        value = el.currentStyle[styleProp];
        // convert other units to pixels on IE
        if (/^\d+(em|pt|%|ex)?$/i.test(value)) { 
            return (function(value) {
                let oldLeft = el.style.left, oldRsLeft = el.runtimeStyle.left;
                el.runtimeStyle.left = el.currentStyle.left;
                el.style.left = value || 0;
                value = el.style.pixelLeft + "px";
                el.style.left = oldLeft;
                el.runtimeStyle.left = oldRsLeft;
                return value;
          })(value);
        }
        return value;
    }
};


const dragPanel = (e, panel) => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = () => {
        document.onmouseup = null;
        document.onmousemove = null;
    };
    document.onmousemove = (event) => {
        event = event || window.event;
        event.preventDefault();
        pos1 = pos3 - event.clientX;
        pos2 = pos4 - event.clientY;
        pos3 = event.clientX;
        pos4 = event.clientY;
        panel.style.top = (panel.offsetTop - pos2) + "px";
        panel.style.left = (panel.offsetLeft - pos1) + "px";
    };
};

const getMaxElementCountTable = (parent) => {
    const Table = parent;
    Table.className = 'table-list';
    const saveTable = Table.innerHTML;
    Table.innerHTML = ``;
    const workHeight = Number.parseInt(getStyle(Table, 'height'));
    const tempEl = document.createElement('div');
    Table.appendChild(tempEl);
    tempEl.className = 'table-list-tr';
    const elementHeight = Number.parseInt(getStyle(document.querySelector('.table-list-tr'), 'height'));
    Table.removeChild(tempEl);
    Table.innerHTML = saveTable;
    Table.classList.remove('table-list');
    return Math.floor((workHeight-elementHeight)/elementHeight);
};


const numberFilterParam = {
    value: ["equal", "notequal", "greater", "greaterorequal", "less", "lessorequal"],
    text: ["Дорівнює", "Не дорівнює", "Більше", "Більше або дорівнює", "Менше", "Менше  або дорівнює"]
};

const textFilterParam = {
    value: ["contains", "notcontains"],
    text: ["Містить", "Не містить"]
};

const boolFilterParam = {
    value: ["chois"],
    text: ["Вибір"]
}

let zIndex = 100;
let listPanel = [];

const zIndexInc = () => {
    zIndex += 100;
    return zIndex;
};

const zIndexDec = () => {
    zIndex -= 100;
    return zIndex;
};

/*************************************************************** 
*********************Dialog Select Object***********************
***************************************************************/

class PageNum {
    constructor() {
        this.num = 1;
    }
    set(input = 0) {
        this.num = input;
    }
    get() {
        return this.num;
    }
} 

class SortObj {
    constructor() {
        this.type = -1;
        this.name = "";
    }
    set(name = '', type = 0) {
        this.name = name;
        this.type = type;
    }
    getType() {
        if (this.type === 0) {
            return 'toincrease';
        } 
        return 'todecrease';
    }
    getName() {
        return this.name;
    }
    getTypeNum() {
        return this.type;
    }
}

class tableFilter {
    constructor(name) {
        this.name = name;
        this.list = [];
    }
    getName() {
        return this.name;
    }
    clearChecked() {
        for (let index = 0; index < this.list.length; index++) {
            //this.list[index].value = '';
            this.list[index].checked = false;
            this.list[index].fast = false;
        }
    }
    clear() {
        this.list.splice(0, this.list.length);   
    }
    add(name, action, value, checked, fast) {
        fast = (""+fast) === "true";
        this.list.push({name, action, value, checked, fast});
    }
    getAll() {
        return this.list;
    }
}

class FilterTableList {
    constructor(name) {
        this.list = new tableFilter(name);
    }
    get() {
       return this.list;
    }
}

class FilterDocumentID {
    constructor(starter = "") {
        this.id = 0;
        this.starter = starter;
    }
    new() {
        let newID = ++this.id;
        return this.starter+"^"+newID;
    }
    default() {
        this.id = 0;
    }
};

class GridHeadDocumentID {
    constructor(starter = "") {
        this.id = 0;
        this.starter = starter;
    }
    new() {
        let newID = ++this.id;
        return this.starter+"^"+newID;
    }
    default() {
        this.id = 0;
    }
}

class GridDocumentID {
    constructor(starter = "") {
        this.id = 0;
        this.starter = starter;
    }
    new() {
        let newID = ++this.id;
        return this.starter+"^"+newID;
    }
    default() {
        this.id = 0;
    }
}

class TableHead {
    constructor() {
        this.names = [];
        this.captions = [];
    }
    add(name, caption) {
        this.names.push(name);
        this.captions.push(caption);
    }
    clear() {
        this.names.splice(0, this.names.length); 
        this.captions.splice(0, this.captions.length); 
    }
    getNames() {
        return this.names;
    }
    getNameByCap(cap) {
        const pos = this.captions.findIndex(el => {return cap === el});
        if (pos > -1) {
            return this.names[pos];
        }
        return "";
    }
    getCaptions() {
        return this.captions;
    }
}


class FilterPanel {
    constructor(_filterTableList_ = FilterTableList, _tableHead_ = TableHead, _loadTable_ = () => {}) {
        this.zIndex = zIndexInc(); 
        this._wrapper = HTMLDivElement;
        this._filterDocumentID = new FilterDocumentID(this.zIndex);
        this._filterTableList = _filterTableList_;
        this._tableHead = _tableHead_;
        this._loadTable = _loadTable_;
        this._filterTableBody = HTMLTableSectionElement;

        this._build();
    }

    _setFilterNameParamByValue = (id) => {
        const name = document.getElementById("filter_name_"+id);
        const action = document.getElementById("filter_action_"+id);
        const value = document.getElementById("filter_value_"+id);
        let saveValue = value.value;
        if (numberFilterParam.value.includes(action.value)) {
            const parent = value.parentNode;
            if (Number.isNaN(+saveValue)) {
                saveValue = 0; 
            } 
            parent.innerHTML = `<input type="number" id="filter_value_${id}" style="max-width: 100px;" value = "${+saveValue}"></input>`;
        } else if (boolFilterParam.value.includes(action.value)) {
            const parent = value.parentNode;
            parent.innerHTML = `<select id = "filter_value_${id}">
            <option hidden="" disabled="" selected="" value="">  </option>
            <option value="true">Так</option>
            <option value="false">Ні</option>
            </select>`; 
        } else {
            const parent = value.parentNode;
            parent.innerHTML = `<input type="text" id="filter_value_${id}" style="max-width: 100px;" value = "${saveValue}"></input>`;
        }
        document.getElementById("filter_value_"+id).addEventListener('change', (event) => {
            const sid = event.target.id.split("filter_value_")[1];
            document.getElementById("filter_checkbox_"+sid).checked = true;
        });
    }
    
    _changeFilterValueParam = (event) => {
        const id = event.target.id.split("filter_action_")[1];
        this._setFilterNameParamByValue(id);
    }
    
    _addNewFilter = (event) => {
        event?.stopPropagation();
        const newLine = document.createElement('tr');
        this._filterTableBody.appendChild(newLine);
    
        const id = this._filterDocumentID.new();
        
        newLine.id = 'filter_line_'+id;
    
        const checkbox = document.createElement('td');
        newLine.appendChild(checkbox);
        const inp1 = document.createElement('input');
            inp1.type = 'checkbox';
            inp1.id = 'filter_checkbox_'+id;
            checkbox.appendChild(inp1);
            inp1.addEventListener('click', (event) => {
                event.stopPropagation();
                const sid = event.target.id.split("filter_checkbox_")[1];
                document.getElementById('filter_line_'+sid).setAttribute("fast", false);
            });
    
        const name = document.createElement('td');
        newLine.appendChild(name);
            const scrollName = document.createElement('select');
            scrollName.id = 'filter_name_'+id;
            scrollName.innerHTML = `<option hidden disabled selected value>  </option>`;
            for (let index = 0; index < this._tableHead.getNames().length; index++) {
                const name = this._tableHead.getNames()[index];
                const cap = this._tableHead.getCaptions()[index];
                const element = document.createElement('option');
                element.value = name;
                element.text = cap;
                scrollName.appendChild(element);
            }
            scrollName.style.width = '100px';
            name.appendChild(scrollName);
    
    
        const action = document.createElement('td');
        newLine.appendChild(action);
            const actionName = document.createElement('select');
            actionName.id = "filter_action_"+id;
            actionName.style.width = '100px';
            actionName.innerHTML = `<option hidden="" disabled="" selected="" value="">  </option>`;
            for (let index = 0; index < numberFilterParam.value.length; index++) {
                const value = numberFilterParam.value[index];
                const text = numberFilterParam.text[index];
                const opt = document.createElement('option');
                opt.value = value;
                opt.text = text;
                actionName.appendChild(opt);
            } 
            for (let index = 0; index < textFilterParam.value.length; index++) {
                const value = textFilterParam.value[index];
                const text = textFilterParam.text[index];
                const opt = document.createElement('option');
                opt.value = value;
                opt.text = text;
                actionName.appendChild(opt);
            } 
            for (let index = 0; index < boolFilterParam.value.length; index++) {
                const value = boolFilterParam.value[index];
                const text = boolFilterParam.text[index];
                const opt = document.createElement('option');
                opt.value = value;
                opt.text = text;
                actionName.appendChild(opt);
            }             
            actionName.addEventListener('change', this._changeFilterValueParam);
            action.appendChild(actionName);
    
        const value = document.createElement('td');
        newLine.appendChild(value);
            const valueName = document.createElement('input');
            valueName.id = "filter_value_"+id;
            valueName.type = 'text';
            valueName.style.maxWidth = '100px';
            value.appendChild(valueName);
        
        const del = document.createElement('td');
        newLine.appendChild(del);
            const delBut = document.createElement('input');
            delBut.id = "del_but_"+id;
            delBut.type = "button";
            delBut.value = "x";
            delBut.addEventListener('click', this._removeCurrentFilters);
            del.appendChild(delBut);
    
        return newLine;    
    }
    
    _removeCurrentFilters = (event) => {
        event.stopPropagation();
        const id = event.target.id.split("del_but_")[1];
        const parent = document.getElementById('filter_line_'+id);
        parent.parentNode.removeChild(parent);
    };
    
    _setFilterButton = (event) => {
        event.stopPropagation();
        const filters = this._filterTableList.get();
        filters.clear();
        for (const p of this._filterTableBody.childNodes) {
            const id = p.id.split("filter_line_")[1];
            const name = document.getElementById('filter_name_'+id);
            const action = document.getElementById('filter_action_'+id);
            const value = document.getElementById('filter_value_'+id);
            //let checkbox;
            /*
            if (value.value !== '') {
                checkbox = true; 
            } else {
                checkbox = false;
            }
            */
            const checkbox = document.getElementById('filter_checkbox_'+id);
            const fast = document.getElementById('filter_line_'+id).getAttribute("fast");
            filters.add(name.value, action.value, value.value, checkbox.checked, fast);
        }

        document.body.removeChild(this._wrapper);
        zIndexDec();
        
        this._loadTable(false);
    }   
    
    _loadFilters = () => {
        this._filterDocumentID.default(); 
        const filters = this._filterTableList.get();    
        for (const f of filters.getAll()) {
            const newL = this._addNewFilter();
            const id = newL.id.split("filter_line_")[1];
            const name = document.getElementById('filter_name_'+id);
            name.value = f.name;
            const action = document.getElementById('filter_action_'+id);
            action.value = f.action;
            this._setFilterNameParamByValue(id);
            const value = document.getElementById('filter_value_'+id);
            value.value = f.value;
            const checkbox = document.getElementById('filter_checkbox_'+id);
            checkbox.checked = f.checked;
            newL.setAttribute("fast", f.fast);
        }
     }

     _build = () => {
        const wrapper = document.createElement('div');
        document.body.appendChild(wrapper);
        wrapper.className = 'filer-form-wrapper';
        wrapper.classList.add('unselectable');
        wrapper.style.zIndex = this.zIndex;
        this._wrapper = wrapper;
        
        const panel = document.createElement('div');
        wrapper.appendChild(panel);
        panel.className = 'filer-form-dialog';
        
        const caption = document.createElement('div');
        caption.innerHTML = `<span><strong>Фільтрування<strong></span>`;
        caption.className = 'grid-form-caption';
        caption.onmousedown = (event) => {
            dragPanel(event, panel);
        };
        panel.appendChild(caption);

        const butClose = document.createElement('button');
        caption.appendChild(butClose);
        butClose.innerHTML = 'x';
        butClose.onclick = (event) => {
            document.body.removeChild(this._wrapper);
            zIndexDec();
        };
        
        const filter = document.createElement('div');
        panel.appendChild(filter);
        filter.className = 'filter-tab-wrapper';
        filter.style.padding = '4px';


        const panBottomMenu = document.createElement('div');
        panel.appendChild(panBottomMenu);
        panBottomMenu.className = 'grid-form-but-menu';

        const menuBut = document.createElement('div');
        filter.appendChild(menuBut);
        menuBut.className = 'toolbar';

        const mainblock = document.createElement('div');
        filter.appendChild(mainblock);
        mainblock.className = 'filter-list-wrapper';
        const tableFilter = document.createElement('table');
        mainblock.appendChild(tableFilter);
        const thead = document.createElement('thead');
        tableFilter.appendChild(thead);
        thead.innerHTML = `<tr><td></td>
        <td>Назва</td><td>Дія</td><td>Значення</td><td></td>
        </tr>`;
        const filterTableBody = document.createElement('tbody');
        tableFilter.appendChild(filterTableBody); 
        this._filterTableBody = filterTableBody;

        const butAdd = document.createElement('button');
        menuBut.appendChild(butAdd);
        butAdd.className = 'toolbar-button';
        butAdd.textContent = 'Додати';
        butAdd.onclick = this._addNewFilter;

        const butOk = document.createElement('button');
        panBottomMenu.appendChild(butOk);
        butOk.textContent = 'Застосувати';
        butOk.onclick = this._setFilterButton;

        const butCancel = document.createElement('button');
        panBottomMenu.appendChild(butCancel);
        butCancel.textContent = 'Закрити';
        butCancel.onclick = (event) => {
            document.body.removeChild(this._wrapper);
            zIndexDec();
        };

        this._loadFilters();
    }
}


class GridPanelSelectObj {
    constructor(tableName = "", captionText = "", callback = () => {}) {
        this.tableName = tableName;
        this.zIndex = zIndexInc();
        
        const wrapper = document.createElement('div');
        document.body.appendChild(wrapper);
        wrapper.className = 'grid-form-wrapper';
        wrapper.classList.add('unselectable');
        wrapper.style.zIndex = this.zIndex;
        this.wrapper = wrapper;

        const form = document.createElement('div');
        wrapper.appendChild(form);
        form.className = 'grid-form-main';

        const caption = document.createElement('div');
        form.appendChild(caption);
        caption.className = 'grid-form-caption';
        caption.textContent = captionText;
        caption.onmousedown = (event) => {
            dragPanel(event, form);
        };

        const gridPanel = document.createElement('div');
        form.appendChild(gridPanel);
        gridPanel.className = 'grid-form-panel';

        const formMenu = document.createElement('div');
        form.appendChild(formMenu);
        formMenu.className = 'grid-form-but-menu';

        const objGridPan = new GridPanelTable(this.tableName, gridPanel, this.zIndex);
        //objGridPan.Build();

        //Buttons
        const panButCap = document.createElement('div');
        caption.appendChild(panButCap);
        panButCap.style.display = 'flex';

        const butMaximaze = document.createElement('button');
        panButCap.appendChild(butMaximaze);
        butMaximaze.textContent = '[]';
        butMaximaze.onclick = (event) => {
            event.preventDefault();
            if (form.classList.contains('grid-form-main-maximazed')) {
                form.classList.remove('grid-form-main-maximazed'); 
                form.style.top = this._posTop;
                form.style.left = this._posLeft;
            } else {
                this._posTop = form.style.top;
                this._posLeft = form.style.left;
                form.style.top = '0';
                form.style.left = '0';
                form.classList.add('grid-form-main-maximazed');  
            }
            objGridPan.Resize(event);
        };

        const butCloseFormCap = document.createElement('button');
        panButCap.appendChild(butCloseFormCap);
        butCloseFormCap.textContent = 'x';
        butCloseFormCap.onclick = (event) => {
            document.body.removeChild(this.wrapper);
            zIndexDec();
        };

        const butOk = document.createElement('button');
        formMenu.appendChild(butOk);
        butOk.textContent = 'Обрати';
        butOk.onclick = (event) => {
            callback(objGridPan.GetActiveRow());
            this.Close();
        };

        const butCancel = document.createElement('button');
        formMenu.appendChild(butCancel);
        butCancel.textContent = 'Закрити';
        butCancel.onclick = this.Close;
    }

    Close = () => {
        document.body.removeChild(this.wrapper);
        zIndexDec();
    }
}

class GridPanelTable {
    constructor(tableName = "", parent = HTMLDivElement, zIndex = "", first = false) {
        this._tableName = tableName;
        this._parent = parent;
        this._pageNum = new PageNum();
        this._pageCount = new PageNum();
        this._sortObj = new SortObj();
        this._zIndex = zIndex;
        this._filterTableList = new FilterTableList(tableName);
        this._tableHead = new TableHead();
        this._gridHeadDocumentID = new GridHeadDocumentID(zIndex);
        this._gridDocumentID = new GridDocumentID(zIndex);
        this._activeGridElement = "";
        this._panGrid = HTMLDivElement;
        this._grid = HTMLTableElement;
        this._pagination = HTMLTableElement;
        this._paginationField = HTMLDivElement;
        this._paginationInput = HTMLInputElement;
        this._paginationInputBut = HTMLButtonElement;
        this._fastFilterBut = HTMLButtonElement;

        this._build();
        if(first) {
            window.addEventListener('resize', this.Resize);
        }
    }

    Resize = (event) => {
        console.log('resize');
        event.stopPropagation();
        this._loadTable(false);
    }

    GetActiveRow = () => {
        if(this._activeGridElement === "") {
            return null;
        }
        const td = document.getElementById(this._activeGridElement);
        return td.parentNode;
    };

    _loadTable = (first = false) => {
        const obj = {};
        obj.table = this._tableName;
        obj.countElement = getMaxElementCountTable(this._panGrid);
        obj.page = this._pageNum.get();
        if (this._sortObj.getName() != '') {
            obj.sort = this._sortObj.getName();
            obj.sortType = this._sortObj.getType();
        } else {
            obj.sort = '';
            obj.sortType = '';
        }
        obj.filters = [];
        const filters = this._filterTableList.get();  
        for (const f of filters.getAll()) {
            if (f.value !== '' && f.checked) {
                const setF = {
                    name: f.name,
                    action: f.action, 
                    value: f.value
                }
                obj.filters.push(setF);
            }
        }

        console.log(obj);

        sendFetch("post", "/loadtable", JSON.stringify(obj), 
        (response) => {
            console.log(response);
            if (response.countPage === 1) {
                this._pagination.style.visibility = 'hidden'; 
            } else {
                this._makePaginate(response.page, response.countPage);
            }

            const headers = this._makeTableHead(response.tableHeaders);
            const body = this._createTableBody(response.items);
            
            if (first) {
                const filters = this._filterTableList.get();   
                for (const el of this._tableHead.getCaptions()) {
                    filters.add(this._tableHead.getNameByCap(el), "contains", "", false, false);
                }       
            }             

            const Table = document.createElement('table');
            while (this._panGrid.childNodes.length > 0) {
                this._panGrid.removeChild(this._panGrid.childNodes[0]);    
            }
            this._panGrid.appendChild(Table);
            this._grid = Table;
            if(response.items.length === obj.countElement) {
                this._grid.className = 'table-list';
            }
            this._grid.appendChild(headers);
            this._grid.appendChild(body);
        }, 
        (error) => {alert(error + `\n       
        Зверніться в службу технічної підтримки`);});
    }

    /************************
           Grid block
    ************************/
        _makeArrowSort = (num, id) => {
            const d = document.createElement('span');
            d.id = "sort_arrow_id_"+id;
            d.innerHTML = `&uarr;`;
            if (num === 0) {
                d.innerHTML = `&darr;`;  
            }
            return d;
        };
        
        _getIDHeadGridElement = (id = "") => {
            if(id.includes("sort_arrow_id_")) {
                return id.split("sort_arrow_id_")[1];
            }
            if(id.includes("td_head_id_")) {
                return id.split("td_head_id_")[1];
            }
            if(id.includes("td_head_wrapper_id_")) {
                return id.split("td_head_wrapper_id_")[1];
            }
            if(id.includes("td_head_cap_id_")) {
                return id.split("td_head_cap_id_")[1];
            }
            if(id.includes("td_head_filter_id_")) {
                return id.split("td_head_filter_id_")[1];
            }
            if(id.includes("td_head_filter_img_id_")) {
                return id.split("td_head_filter_img_id_")[1];
            }
            if(id.includes("td_head_cap_span_id_")) {
                return id.split("td_head_cap_span_id_")[1];
            }
            return -1;
        }

    _makeTableHead = (elements = []) => {
        const thead = document.createElement("thead");
        const tr = document.createElement("tr");
        tr.className = "table-list-tr";
        this._tableHead.clear();
        this._gridHeadDocumentID.default();
        for (let index = 0; index < elements.length; index++) {
            const elem = elements[index];
            this._tableHead.add(elem.name, elem.caption);
            const td = document.createElement('td');
            const newID = this._gridHeadDocumentID.new();
            td.id = "td_head_id_"+newID;
            const tdDiv = document.createElement('div');
            tdDiv.id = "td_head_wrapper_id_"+newID;
            td.appendChild(tdDiv);
            tdDiv.style.display = 'flex';
            tdDiv.style.flexDirection = 'row';
            tdDiv.style.justifyContent = 'space-between';
            const tdCap = document.createElement('div');
            tdCap.id = "td_head_cap_id_"+newID;
            const tdFilter = document.createElement('div');
            tdFilter.id = "td_head_filter_id_"+newID;
    
            const filters = this._filterTableList.get();
            let ok = false;
            for (const f of filters.getAll()) {
                if (f.name === elem.name) {
                    ok = f.checked;
                }
            }
            if (!ok) {
                tdFilter.style.display = 'none';    
            }
                const imgFilter = document.createElement('img');
                imgFilter.src = 'static/img/filter-th.svg';
                imgFilter.id = "td_head_filter_img_id_"+newID;
                imgFilter.style.maxWidth = '12px';
                tdFilter.appendChild(imgFilter);
            tdDiv.appendChild(tdCap);
            tdDiv.appendChild(tdFilter);
            td.className = "table-list-th-name";
            tdCap.innerHTML = `<span id="td_head_cap_span_id_${newID}">${elem.caption}</span>`;
            if (this._sortObj.getName() === elem.name) {
                td.setAttribute('sort', this._sortObj.getTypeNum());
                tdCap.appendChild(this._makeArrowSort(this._sortObj.getTypeNum(), newID));
            }
            if (index == 0) {
                td.className = "table-list-th-id";
            }
            td.classList.add("table-list-th");
            td.classList.add("unselectable");
            td.onclick = (event) => {
                event.preventDefault();
                for (let i = 0; i < thead.childNodes[0].childNodes.length; i++) {
                    const element = thead.childNodes[0].childNodes[i];
                    if (this._getIDHeadGridElement(event.target.id) === this._getIDHeadGridElement(element.id)) {
                        const id = this._getIDHeadGridElement(element.id);
                        const name = document.getElementById('td_head_cap_span_id_'+id);
                        const parent = document.getElementById('td_head_cap_id_'+id);
                        if (element.hasAttribute('sort')) {
                            const arrow = document.getElementById('sort_arrow_id_'+id);
                            if (+element.getAttribute('sort') === 0) {
                                element.setAttribute('sort', 1); 
                                parent.removeChild(arrow);
                                parent.appendChild(this._makeArrowSort(1, id));
                            } else {
                                element.setAttribute('sort', 0);
                                parent.removeChild(arrow);
                                parent.appendChild(this._makeArrowSort(0, id));
                            }
                        } else {
                            element.setAttribute('sort', 0);
                            parent.appendChild(this._makeArrowSort(0, id));
                        }
                        this._sortObj.set(this._tableHead.getNameByCap(name.textContent), +element.getAttribute('sort'));
                    } else {
                        if (element.getAttribute('sort') !== null) {
                            const id = this._getIDHeadGridElement(element.id);
                            const arrow = document.getElementById('sort_arrow_id_'+id);
                            const parent = arrow.parentNode; 
                            parent.removeChild(arrow);
                            element.removeAttribute('sort');
                        }
                    }
                }
                this._loadTable(false);
            };
            tr.appendChild(td);
        }
        thead.appendChild(tr);
        return thead;
    }

    _createTableBody = (elements = []) => {
        const tbody = document.createElement("tbody");
        this._gridDocumentID.default();
        elements.forEach(element => {
            tbody.appendChild(this._createTableRow(element));
        });
        return tbody;
    };
    
    _createTableRow = (elements) => {
        let actRow = false;
        const newRow = document.createElement('tr');
        newRow.className = 'table-list-tr';
        const tableHeaders = this._tableHead.getNames();
        newRow.setAttribute('objid', elements.id);
        newRow.setAttribute('objcap', elements.name === undefined ? "" : elements.name);
        for (let i = 0; i < tableHeaders.length; i++) {
            const tableHeader = tableHeaders[i];
            const td = document.createElement('td');
            td.id = "grid_id_"+this._gridDocumentID.new();
            if (tableHeader === "id") {
                td.className = 'table-list-td-id';
            } else {
                td.className = 'table-list-td-name';
            }
            td.classList.add('unselectable');
            td.classList.add('td-size');
    
            if (td.id === this._activeGridElement) {
                actRow = true;
                td.classList.add('td-active'); 
                
                const filters = this._filterTableList.get();
                let ok = false;
                for (const f of filters.getAll()) {
                    if (f.name === tableHeader) {
                        ok = true;
                        if (f.fast === true) {
                            this._fastFilterBut.classList.add('active-fast-filter');  
                        } else {
                            this._fastFilterBut.classList.remove('active-fast-filter');  
                        }
                    }
                }
                if (!ok) {
                    this._fastFilterBut.classList.remove('active-fast-filter');
                }
            }
            
            let value = elements[tableHeader] === undefined ? "" : elements[tableHeader]
    
            td.title = value;
            td.innerText = value;
            td.setAttribute('tableName', tableHeader);
            td.onclick = (event) => {
                const actElem = event.target;
                const elements = document.querySelectorAll('.td-size');
                for (const element of elements) {
                    if (element === actElem) {
                        this._activeGridElement = event.target.id;
                        actElem.classList.add('td-active'); 
                        for (const it of actElem.parentNode.childNodes) {
                            if (it !== actElem) {
                                it.classList.add('tr-active'); 
                            }
                        }
    
                        const filters = this._filterTableList.get();
                        for (const f of filters.getAll()) {
                            if (f.name === tableHeader) {
                                if (f.fast === true) {
                                    this._fastFilterBut.classList.add('active-fast-filter');  
                                } else {
                                    this._fastFilterBut.classList.remove('active-fast-filter');  
                                }
                            }
                        }
                    } else {
                        element.classList.remove('td-active');
    
                        if (!element.parentNode.contains(actElem)) {
                            for (const it of element.parentNode.childNodes) {
                                it.classList.remove('tr-active'); 
                            }
                        } else {
                            actElem.classList.remove('tr-active');
                        }
                    }
                }
            };
            newRow.appendChild(td);
        }
    
        if (actRow) {
            for (const it of newRow.childNodes) {
                if (it.id !== this._activeGridElement) {
                    it.classList.add('tr-active'); 
                }
            }
        }
    
        return newRow;
    };

    /************************
        Pagination block
    ************************/

    _changePage = (event) => {
        this._pageNum.set(+event.target.innerText);
        this._loadTable(false);
    }

    _decPage = () => {
        let page = this._pageNum.get();
        page--;
        if (page <= 0 ) {
            return;
        }
    
        this._pageNum.set(page);
        this._loadTable(false);
    };
    
    _incPage = () => {
        let page = this._pageNum.get();
        page++;
        if (page > this._pageCount.get()) {
            return;
        }
    
        this._pageNum.set(page);
        this._loadTable(false);
    };
    
    _inputChangePage = (event) => {
        if (event.keyCode != 13 && event.target !== this._paginationInputBut) {
            return;
        }

        const page = Number(this._paginationInput.value);
        if (Number.isNaN(page)) {
            return;
        }
        if (page > this._pageCount.get() || page < 1) {
            return;
        }
        this._pageNum.set(page);
        this._loadTable(false);
        this._paginationInput.value = '';
    };

    _makePag3Dot = () => {
        const el = document.createElement("div");
        el.innerText = '...';
        el.style.marginRight = '12px';
        el.style.marginLeft = '4px';
        return el;
    }

    _makeButtonPage = (num, numAct) => {
        const el = document.createElement("button");
        el.className = 'toolbar-button';
        el.innerText = num;
        el.style.marginRight = '8px';
        if (num === numAct) {
            el.classList.add('active-num-page');
        }
        el.addEventListener('click', this._changePage);
        return el;
    }

    _makePaginate = (actPage = 0, countPage = 0) => {       
        this._paginationInput.setAttribute('min', 1);
        this._paginationInput.setAttribute('max', countPage);

        this._pageCount.set(countPage);
    
        this._paginationField.innerHTML = ``;
    
        if (Math.round(countPage/7)>1) {
           if (actPage - 4 > 0) {
            this._paginationField.appendChild(this._makeButtonPage(1, actPage));
            this._paginationField.appendChild(this._makePag3Dot());
            if (countPage-actPage < 5) {
                for (let i = countPage-5; i <= countPage; i++) {
                    this._paginationField.appendChild(this._makeButtonPage(i, actPage));
                }
            } else {
                for (let i = actPage-1; i <= actPage+1; i++) {
                    this._paginationField.appendChild(this._makeButtonPage(i, actPage));
                }
                this._paginationField.appendChild(this._makePag3Dot());
                this._paginationField.appendChild(this._makeButtonPage(countPage));  
            }
           } else {
                for (let i = 1; i <= 5; i++) {
                    this._paginationField.appendChild(this._makeButtonPage(i, actPage));
                }
                this._paginationField.appendChild(this._makePag3Dot());
                this._paginationField.appendChild(this._makeButtonPage(countPage));
           } 
        } else {
            for (let i = 1; i <= 7; i++) {
                this._paginationField.appendChild(this._makeButtonPage(i, actPage));
            }
        }
    }


    /************************
           Filter block
    ************************/
   
    _showFilter = (event) => {
        event.preventDefault(); 
        const panFil = new FilterPanel(this._filterTableList, this._tableHead, this._loadTable);
        //panFil.Build();
    }

    _makeFastFilter = (event) => {
        event.stopPropagation();
        const elem = document.getElementById(this._activeGridElement);
        if (elem === null) {
            return;
        }
        const name = elem.getAttribute("tablename");
        const value = elem.textContent;
    
        let ok = false;
    
        const filters = this._filterTableList.get();
        for (const f of filters.getAll()) {
            if (f.name === name) {
                if (f.fast) {
                    f.checked = false;
                    f.fast = false;
                } else {
                    f.action = "contains";
                    f.value = value;
                    f.checked = true;
                    f.fast = true;
                }
                ok = true;
                break;
            }
        }    
    
        if (!ok) {
            filters.add(name, "contains", value, true, true);
        }
    
        this._loadTable(false);
    };
    
    _clearFilter = (event) => {
        event.stopPropagation();
        const filters = this._filterTableList.get();
        filters.clearChecked();
        this._loadTable(false);
    };

    /************************
            Action Block
    ************************/
    
    _addNewElement = (event) => {
        event.stopPropagation();
        sendFetch("get", "/element?table="+this._tableName+"&id=0", null, (response) => {
            //console.log(response);
            const pan = new Editor(this._tableName, "Створення нового елементу", response, () => {
                let list = document.querySelectorAll('.edit-input-element-'+zIndex);
                const obj = {};
                for (const el of list) {
                    const key = el.getAttribute('name');
                    let value = el.getAttribute('objid') ? el.getAttribute('objid') : el.value;
                    if (el.getAttribute('type') === "number") {
                        if (!Number.isNaN(Number(value))) {
                            value = Number(value);
                        }
                    }
                    obj[key] = value;
                }
                sendFetch("post", "/elementedit?table="+this._tableName, JSON.stringify(obj), (response) => {
                    if (response.result !== "ok") {
                        alert(response.result);
                    }
                    this._loadTable(false);
                },
                (error) => {alert(error + `\n       
                Зверніться в службу технічної підтримки`);});
            }, () => {this._loadTable(false);});
        },
        (error) => {alert(error + `\n       
        Зверніться в службу технічної підтримки`);});
    }

    _editElement = (event) => {
        event.stopPropagation();
        
        const actRow = this.GetActiveRow();
        if (actRow === null) {
            return;
        }

        for (const it of actRow.childNodes) {
            if (it.getAttribute("tablename") === "id") {
                sendFetch("get", "/element?table="+this._tableName+"&id="+it.title, null, (response) => {
                    //console.log(response);
                    const pan = new Editor(this._tableName, "Редагування елементу", response, () => {
                        let list = document.querySelectorAll('.edit-input-element-'+zIndex);
                        const obj = {};
                        for (const el of list) {
                            const key = el.getAttribute('name');
                            let value = el.getAttribute('objid') ? el.getAttribute('objid') : el.value;
                            if (el.getAttribute('type') === "number") {
                                if (!Number.isNaN(Number(value))) {
                                    value = Number(value);
                                }
                            }
                            obj[key] = value;
                        }
                        sendFetch("post", "/elementedit?table="+this._tableName, JSON.stringify(obj), (response) => {
                            if (response.result !== "ok") {
                                alert(response.result);
                            }
                            this._loadTable(false);
                        },
                        (error) => {alert(error + `\n       
                        Зверніться в службу технічної підтримки`);});
                    }, () => {this._loadTable(false);});
                },
                (error) => {alert(error + `\n       
                    Зверніться в службу технічної підтримки`);});           
            }
        }
    }

    /************************
           Global block
    ************************/

    _build = () => {
        const PanMenu = document.createElement('div');
        PanMenu.className = 'toolbar';
        this._parent.appendChild(PanMenu);

        const panFilterMenu = document.createElement('div');

        const PanGrid = document.createElement('div');
        this._parent.appendChild(PanGrid);
        PanGrid.style.height = '100%';
        this._panGrid = PanGrid;

        const PanPagin = document.createElement('div');
        PanPagin.className = 'grid-form-pagination-wrapper';
        this._parent.appendChild(PanPagin);
        this._pagination = PanPagin;

        //Buttons
        const butRefresh = document.createElement('button');
        butRefresh.className = 'toolbar-button';
        PanMenu.appendChild(butRefresh);
        butRefresh.textContent = "Оновити";
        butRefresh.onclick = (event) => {this._loadTable(true);};

        const butAdd = document.createElement('button');
        butAdd.className = 'toolbar-button';
        PanMenu.appendChild(butAdd);
        butAdd.textContent = "Додати";
        butAdd.onclick = this._addNewElement;

        const butEdit = document.createElement('button');
        butEdit.className = 'toolbar-button';
        PanMenu.appendChild(butEdit);
        butEdit.textContent = "Редагувати";
        butEdit.onclick = this._editElement;

        PanMenu.appendChild(panFilterMenu);

        const butFilter = document.createElement('button');
        butFilter.className = 'toolbar-button';
        panFilterMenu.appendChild(butFilter);
        butFilter.textContent = "Фільтрувати";
        butFilter.onclick = this._showFilter;

        const butFilterFast = document.createElement('button');
        butFilterFast.className = 'toolbar-button';
        panFilterMenu.appendChild(butFilterFast);
        butFilterFast.textContent = "Швидке ф";
        butFilterFast.onclick = this._makeFastFilter;
        this._fastFilterBut = butFilterFast;

        const butFilterClear = document.createElement('button');
        butFilterClear.className = 'toolbar-button';
        panFilterMenu.appendChild(butFilterClear);
        butFilterClear.textContent = "Скинути ф";
        butFilterClear.onclick = this._clearFilter;

        const butFilterHist = document.createElement('button');
        butFilterHist.className = 'toolbar-button';
        panFilterMenu.appendChild(butFilterHist);
        butFilterHist.textContent = "Історія ф";

        //Pagination
        const pagLeft = document.createElement('div');
        PanPagin.appendChild(pagLeft);

        const pagPagin = document.createElement('div');
        pagPagin.className = 'grid-form-pagination-field';
        PanPagin.appendChild(pagPagin);
        this._paginationField = pagPagin;

        const pagRight = document.createElement('div');
        PanPagin.appendChild(pagRight);

        const pagInput = document.createElement('div');
        pagInput.className = 'grid-form-pagination-field';
        PanPagin.appendChild(pagInput);

        //buttons
        const butPagLeft = document.createElement('button');
        pagLeft.appendChild(butPagLeft);
        butPagLeft.innerHTML = '&lArr;';
        butPagLeft.onclick = this._decPage;
        butPagLeft.className = 'toolbar-button';

        const butPagRight = document.createElement('button');
        pagRight.appendChild(butPagRight);
        butPagRight.innerHTML = '&rArr;';
        butPagRight.onclick = this._incPage;
        butPagRight.className = 'toolbar-button';

        const inputPagin = document.createElement('input');
        pagInput.appendChild(inputPagin);
        inputPagin.type = 'number';
        inputPagin.onkeyup = this._inputChangePage;
        this._paginationInput = inputPagin;

        const butPagInput = document.createElement('button');
        pagInput.appendChild(butPagInput);
        butPagInput.innerHTML = '&crarr;';
        butPagInput.className = 'toolbar-button';
        butPagInput.onclick = this._inputChangePage;
        this._paginationInputBut = butPagInput;

        this._loadTable(true);
    }
}


class Editor {
    constructor(tableName = "", captionText = "", obj = {}, callback = () => {}, cancel = () => {}) {
        this.tableName = tableName;
        this.captionText = captionText;
        this.obj = obj;
        this._callback = callback;
        this._cancel = cancel;
        this.zIndex = zIndexInc();
        this._wrapper = HTMLDivElement;

        this._build();
    }

    _build = () => {
        const wrapper = document.createElement('div');
        document.body.appendChild(wrapper);
        wrapper.className = 'dialog-form-wrapper';
        wrapper.classList.add('unselectable');
        wrapper.style.zIndex = this.zIndex;
        this._wrapper = wrapper;

        const panel = document.createElement('div');
        wrapper.appendChild(panel);
        panel.className = 'dialog-form-panel';

        const cap = document.createElement('div');
        panel.appendChild(cap);
        cap.innerHTML = this.captionText;
        cap.className = "dialog-form-caption";
        cap.onmousedown = (e) => {
            dragPanel(e, panel);
        };

        const butClose = document.createElement('button');
        cap.appendChild(butClose);
        //butClose.className = 'but-close-wrapper-modal';
        butClose.innerHTML = 'x';
        butClose.onclick = (event) => {
            this._cancel();
            zIndexDec();
            document.body.removeChild(this._wrapper);
        };

        const workPanel = document.createElement('div');
        panel.appendChild(workPanel);
        workPanel.className = "dialog-work-panel";

        const butPanel = document.createElement('div');
        panel.appendChild(butPanel);
        butPanel.className = "dialog-but-menu";
        const butOk = this._makeButtonEditor(butPanel, "Застосувати");
        butOk.onclick = (event) => {
            this._callback();
            zIndexDec();
            document.body.removeChild(this._wrapper);
        };
        butOk.style.marginRight = "10px";
        const butCancel = this._makeButtonEditor(butPanel, "Закрити");
        butCancel.onclick = (event) => {
            this._cancel();
            zIndexDec();
            document.body.removeChild(this._wrapper);
        };

        for (const objEl of this.obj) {
            //console.log(obj);
            switch (objEl.struct.type) {
                case "number":
                    this._makeNumberElementPanel(workPanel, objEl);
                    break;
                case "booling":
                    this._makeBoolingElementPanel(workPanel, objEl);
                    break;    
                case "relation":
                    this._makeRelationElementPanel(workPanel, objEl);
                    break;
                default:
                   this._makeStringElementPanel(workPanel, objEl);
                    break;
            }
        }    
    }

    _makeButtonEditor = (parent, cap) => {
        const el = document.createElement('button');
        parent.appendChild(el);
        el.innerHTML = cap;
        el.className = "dialog-but-menu-element";
        return el;
    }
    
    _makeStringElementPanel = (parent = HTMLDivElement, obj = {}) => {
        const main = document.createElement('div');
        parent.appendChild(main);
    
        if (!obj.struct.show) {
            main.style.display = "none";
        }
    
        const cap = document.createElement('div');
        main.appendChild(cap);
        cap.innerHTML = `<span>${obj.struct.caption}</span>`;
    
        const edit = document.createElement('input');
        main.appendChild(edit);
        edit.setAttribute("name", obj.struct.name);
        edit.classList.add('edit-input-element-'+zIndex);
        edit.value = obj.value === undefined ? "" : obj.value;
    }
    
    _makeNumberElementPanel = (parent = HTMLDivElement, obj = {}) => {
        const main = document.createElement('div');
        parent.appendChild(main);
    
        if (!obj.struct.show) {
            main.style.display = "none";
        }
    
        const cap = document.createElement('div');
        main.appendChild(cap);
        cap.innerHTML = `<span>${obj.struct.caption}</span>`;
    
        const edit = document.createElement('input');
        main.appendChild(edit);
        edit.classList.add('edit-input-element-'+zIndex);
        edit.setAttribute("name", obj.struct.name);
        edit.type = "number";
        edit.value = obj.value === undefined ? "" : obj.value;
    }
    
    _makeBoolingElementPanel = (parent = HTMLDivElement, obj = {}) => {
        const main = document.createElement('div');
        parent.appendChild(main);
    
        if (!obj.struct.show) {
            main.style.display = "none";
        }
    
        const cap = document.createElement('div');
        main.appendChild(cap);
        cap.innerHTML = `<span>${obj.struct.caption}</span>`;
    
        const edit = document.createElement('select');
        edit.style.width = '50px';
        main.appendChild(edit);
        edit.classList.add('edit-input-element-'+zIndex);
        edit.setAttribute("name", obj.struct.name);
            const elTrue = document.createElement('option');
            elTrue.value = "true";
            elTrue.text = "Так";
            edit.appendChild(elTrue);
            const elFalse = document.createElement('option');
            elFalse.value = "false";
            elFalse.text = "Ні";
            edit.appendChild(elFalse);
        edit.value = obj.value === undefined ? "" : obj.value;
    }

    _makeRelationElementPanel = (parent = HTMLDivElement, objIn = {}) => {
        //console.log(obj);
        const main = document.createElement('div');
        parent.appendChild(main);
    
        if (!objIn.struct.show) {
            main.style.display = "none";
        }
    
        const cap = document.createElement('div');
        main.appendChild(cap);
        cap.innerHTML = `<span>${objIn.struct.caption}</span>`;
    
        const wrapper = document.createElement('div');
        main.appendChild(wrapper);
            const edit = document.createElement('input');
            wrapper.appendChild(edit);
            edit.setAttribute("name", objIn.struct.name);
            edit.classList.add('edit-input-element-'+zIndex);
            edit.readOnly = true
            edit.value = objIn.value === undefined ? "" : objIn.value;
            edit.setAttribute('objid', objIn.id);
            const butChk = document.createElement('button');
            butChk.innerHTML = `...`;
            wrapper.appendChild(butChk);
            butChk.onclick = (event) => {
                sendFetch("get", "/elementlist?table="+objIn.struct.name, null, (response) => {
                    //console.log(response);
                    const pan = new GridPanelSelectObj(objIn.struct.name, "Обрати елемент", (el) => {
                        //console.log(el);
                        if (el) {
                            edit.value = el.getAttribute('objcap');
                            edit.setAttribute('objid', el.getAttribute('objid'));
                        }
                    });
                },
                (error) => {alert(error + `\n       
                Зверніться в службу технічної підтримки`);});
            };
            const butDel = document.createElement('button');
            butDel.innerHTML = `X`;
            wrapper.appendChild(butDel);
            butDel.onclick = (event) => {
                edit.value = '';
                edit.setAttribute('objid', '0');
            };
            const butSwitch = document.createElement('button');
            butSwitch.innerHTML = `->`;
            wrapper.appendChild(butSwitch);  
            butSwitch.onclick = (event) => {
                const objID = edit.getAttribute('objid');
                if (objID === "") {
                    return;
                }
                sendFetch("get", "/element?table="+objIn.struct.name+"&id="+objID, null, (response) => {
                    //console.log(response);
                    const newEdit = new Editor(objIn.struct.name, "Редагування елементу", response, () => {
                        let list = document.querySelectorAll('.edit-input-element-'+zIndex);
                        const obj = {};
                        for (const el of list) {
                            const key = el.getAttribute('name');
                            let value = el.getAttribute('objid') ? el.getAttribute('objid') : el.value;
                            if (el.getAttribute('type') === "number") {
                                if (!Number.isNaN(Number(value))) {
                                    value = Number(value);
                                }
                            }
                            obj[key] = value;
                        }
                        sendFetch("post", "/elementedit?table="+objIn.struct.name, JSON.stringify(obj), (response) => {
                            if (response.result !== "ok") {
                                alert(response.result);
                            } else {
                                edit.value = obj.name;
                                edit.setAttribute('objid', obj.id);
                            }
                        },
                        (error) => {alert(error + `\n       
                        Зверніться в службу технічної підтримки`);});
                    });
                },
                (error) => {alert(error + `\n       
                Зверніться в службу технічної підтримки`);});
            };
    }
}

/*************************************************************** 
*********************Dialog Select Object***********************
***************************************************************/




/*************************************************************** 
*****************************Struct*****************************
***************************************************************/


const mainLoad = () => {
    const main = document.getElementById('main_work_wrapper');
    if (main) {
        const table = document.getElementById('directory_name').textContent;
        const newPan = new GridPanelTable(table, main, "1", true);
    }
};

mainLoad();


/*
const filterTableList = {
    list: tableFilter,
    set(name) {
       this.list = new tableFilter(name);
    },
    get() {
       return this.list;
    }
};

const filterDocumentID = {
    id : 0,
    new() {
        return ++this.id;
    },
    default() {
        this.id = 0;
    }
};

let activeTable = "";

let activeGridElement = "";
const gridDocumentID = {
    id : 0,
    new() {
        return ++this.id;
    },
    default() {
        this.id = 0;
    }
};


const gridHeadDocumentID = {
    id : 0,
    new() {
        return ++this.id;
    },
    default() {
        this.id = 0;
    }
};

const tableHead = {
    names : [],
    captions : [],
    add(name, caption) {
        this.names.push(name);
        this.captions.push(caption);
    },
    clear() {
        this.names.splice(0, this.names.length); 
        this.captions.splice(0, this.captions.length); 
    },
    getNames() {
        return this.names;
    },
    getNameByCap(cap) {
        const pos = this.captions.findIndex(el => {return cap === el});
        if (pos > -1) {
            return this.names[pos];
        }
        return "";
    },
    getCaptions() {
        return this.captions;
    }
};

const pageNum = {
    num : 1,
    set(input = 0) {
        this.num = input;
    },
    get() {
        return this.num;
    }
}; 

const pageCount = {
    num : 1,
    set(input = 0) {
        this.num = input;
    },
    get() {
        return this.num;
    }
}; 

const sortObj = {
    type : -1,
    name: '',
    set(name = '', type = 0) {
        this.name = name;
        this.type = type;
    },
    getType() {
        if (this.type === 0) {
            return 'toincrease';
        } 
        return 'todecrease';
    },
    getName() {
        return this.name;
    },
    getTypeNum() {
        return this.type;
    }
}
*/

/*************************************************************** 
*****************************Struct*****************************
***************************************************************/


/*************************************************************** 
**********************Server Reqeusts***************************
***************************************************************/

//loadStruct - company struct loading at start
/*
const loadStruct = () => {
    activeTable = document.getElementById('directory_name').textContent;
    filterTableList.set(activeTable);
    pageNum.set(1);
    sortObj.set('', -1);
    loadTable(true);
};

const loadTable = (first = false) => {
    const obj = {};
    obj.table = activeTable;
    obj.countElement = getElementCountTable();
    obj.page = pageNum.get();
    if (sortObj.getName() != '') {
        obj.sort = sortObj.getName();
        obj.sortType = sortObj.getType();
    } else {
        obj.sort = '';
        obj.sortType = '';
    }
    obj.filters = [];
    const filters = filterTableList.get();  
    for (const f of filters.getAll()) {
        if (f.value !== '' && f.checked) {
            const setF = {
                name: f.name,
                action: f.action, 
                value: f.value
            }
            obj.filters.push(setF);
        }
    }

    //console.log(obj);

    sendFetch("post", "/loadtable", JSON.stringify(obj), 
    (response) => {
        //console.log(response);
        const Table = document.getElementById('tableBodyID');
        if(response.items.length === obj.countElement) {
            Table.className = 'table-list';
        } else {
            Table.classList.remove('table-list');
        }
        const cols = makeTableColGroup(response.tableHeaders);
        const headers = makeTableHead(response.tableHeaders);
        const body = createTableBody(response.items);
       
        if (first) {
            const filters = filterTableList.get();   
            for (const el of tableHead.getCaptions()) {
                filters.add(tableHead.getNameByCap(el), "contains", "", false, false);
            }       
        }

        makePaginate(response.page, response.countPage);
        Table.innerHTML = ``;
        Table.appendChild(cols);
        Table.appendChild(headers);
        Table.appendChild(body);
    }, 
    (error) => {alert(error + `\n       
    Зверніться в службу технічної підтримки`);});
};
*/

/*************************************************************** 
**********************Server Reqeusts***************************
***************************************************************/

/*
const makeTableColGroup = (elements) => {
    const cgroup = document.createElement("colgroup");
    for (let index = 0; index < elements.length; index++) {
        const col = document.createElement("col");
        col.className = "table-list-col-name";
        if (index == 0) {
            col.className = "table-list-col-id";
        }
        cgroup.appendChild(col);
    }
    return cgroup;
};

const makeTableHead = (elements) => {
    const thead = document.createElement("thead");
    thead.id = 'thead_id';
    const tr = document.createElement("tr");
    tr.className = "table-list-tr";
    tableHead.clear();
    gridHeadDocumentID.default();
    for (let index = 0; index < elements.length; index++) {
        const elem = elements[index];
        tableHead.add(elem.name, elem.caption);
        const td = document.createElement('td');
        const newID = gridHeadDocumentID.new();
        td.id = "td_head_id_"+newID;
        const tdDiv = document.createElement('div');
        tdDiv.id = "td_head_wrapper_id_"+newID;
        td.appendChild(tdDiv);
        tdDiv.style.display = 'flex';
        tdDiv.style.flexDirection = 'row';
        tdDiv.style.justifyContent = 'space-between';
        const tdCap = document.createElement('div');
        tdCap.id = "td_head_cap_id_"+newID;
        const tdFilter = document.createElement('div');
        tdFilter.id = "td_head_filter_id_"+newID;

        const filters = filterTableList.get();
        let ok = false;
        for (const f of filters.getAll()) {
            if (f.name === elem.name) {
                ok = f.checked;
            }
        }
        if (!ok) {
            tdFilter.style.display = 'none';    
        }
            const imgFilter = document.createElement('img');
            imgFilter.src = 'static/img/filter-th.svg';
            imgFilter.id = "td_head_filter_img_id_"+newID;
            imgFilter.style.maxWidth = '12px';
            tdFilter.appendChild(imgFilter);
        tdDiv.appendChild(tdCap);
        tdDiv.appendChild(tdFilter);
        td.className = "table-list-th-name";
        tdCap.innerHTML = `<span id="td_head_cap_span_id_${newID}">${elem.caption}</span>`;
        if (sortObj.getName() === elem.name) {
            td.setAttribute('sort', sortObj.getTypeNum());
            tdCap.appendChild(makeArrowSort(sortObj.getTypeNum(), newID));
        }
        if (index == 0) {
            td.className = "table-list-th-id";
        }
        td.classList.add("table-list-th");
        td.classList.add("unselectable");
        td.addEventListener('click', sort);
        tr.appendChild(td);
    }
    thead.appendChild(tr);
    return thead;
};

const createTableBody = (elements) => {
    const tbody = document.createElement("tbody");
    gridDocumentID.default();
    elements.forEach(element => {
        tbody.appendChild(createTableRow(element));
    });
    return tbody;
};

const createTableRow = (elements) => {
    let actRow = false;
    const newRow = document.createElement('tr');
    newRow.className = 'table-list-tr';
    const tableHeaders = tableHead.getNames();
    for (let i = 0; i < tableHeaders.length; i++) {
        const tableHeader = tableHeaders[i];
        const td = document.createElement('td');
        td.id = "grid_id_"+gridDocumentID.new();
        if (tableHeader === "id") {
            td.className = 'table-list-td-id';
        } else {
            td.className = 'table-list-td-name';
        }
        td.classList.add('unselectable');
        td.classList.add('td-size');

        if (td.id === activeGridElement) {
            actRow = true;
            td.classList.add('td-active'); 
            const fastFilterButton = document.getElementById('filter_fast_but');
            const filters = filterTableList.get();
            let ok = false;
            for (const f of filters.getAll()) {
                if (f.name === tableHeader) {
                    ok = true;
                    if (f.fast === true) {
                        fastFilterButton.classList.add('active-fast-filter');  
                    } else {
                        fastFilterButton.classList.remove('active-fast-filter');  
                    }
                }
            }
            if (!ok) {
                fastFilterButton.classList.remove('active-fast-filter');
            }
        }
        
        let value = elements[tableHeader] === undefined ? "" : elements[tableHeader]

        td.title = value;
        td.innerText = value;
        td.setAttribute('tableName', tableHeader);
        td.onclick = (event) => {
            const actElem = event.target;
            const elements = document.querySelectorAll('.td-size');
            const fastFilterButton = document.getElementById('filter_fast_but');
            for (const element of elements) {
                if (element === actElem) {
                    activeGridElement = event.target.id;
                    actElem.classList.add('td-active'); 
                    for (const it of actElem.parentNode.childNodes) {
                        if (it !== actElem) {
                            it.classList.add('tr-active'); 
                        }
                    }

                    const filters = filterTableList.get();
                    for (const f of filters.getAll()) {
                        if (f.name === tableHeader) {
                            if (f.fast === true) {
                                fastFilterButton.classList.add('active-fast-filter');  
                            } else {
                                fastFilterButton.classList.remove('active-fast-filter');  
                            }
                        }
                    }
                } else {
                    element.classList.remove('td-active');

                    if (!element.parentNode.contains(actElem)) {
                        for (const it of element.parentNode.childNodes) {
                            it.classList.remove('tr-active'); 
                        }
                    } else {
                        actElem.classList.remove('tr-active');
                    }
                }
            }
        };
        newRow.appendChild(td);
    }

    if (actRow) {
        for (const it of newRow.childNodes) {
            if (it.id !== activeGridElement) {
                it.classList.add('tr-active'); 
            }
        }
    }

    return newRow;
};

const getElementCountTable = () => {
    const Table = document.getElementById('tableBodyID');
    Table.className = 'table-list';
    const saveTable = Table.innerHTML;
    Table.innerHTML = ``;
    const workHeight = Number.parseInt(getStyle(Table, 'height'));
    const tempEl = document.createElement('div');
    Table.appendChild(tempEl);
    tempEl.className = 'table-list-tr';
    const elementHeight = Number.parseInt(getStyle(document.querySelector('.table-list-tr'), 'height'));
    Table.removeChild(tempEl);
    Table.innerHTML = saveTable;
    Table.classList.remove('table-list');
    return Math.floor((workHeight-elementHeight)/elementHeight);
};

const makePagBut = (num, numAct) => {
    const el = document.createElement("button");
    el.className = 'toolbar-button';
    el.innerText = num;
    el.style.marginRight = '8px';
    if (num === numAct) {
        el.classList.add('active-num-page');
    }
    el.addEventListener('click', changePage);
    return el;
};

const makePag3Dot = () => {
    const el = document.createElement("div");
    el.innerText = '...';
    el.style.marginRight = '12px';
    el.style.marginLeft = '4px';
    return el;
};

const makePaginate = (actPage = 0, countPage = 0) => {
    const PagField = document.getElementById('pagination_wrapper');
    if (countPage === 1) {
        PagField.style.visibility = 'hidden'; 
    }

    document.getElementById('pagination_input').setAttribute('min', 1);
    document.getElementById('pagination_input').setAttribute('max', countPage);

    pageCount.set(countPage);

    const Pagination = document.getElementById('pagination');
    Pagination.innerHTML = ``;

    if (Math.round(countPage/7)>1) {
       if (actPage - 4 > 0) {
        Pagination.appendChild(makePagBut(1, actPage));
        Pagination.appendChild(makePag3Dot());
        if (countPage-actPage < 5) {
            for (let i = countPage-5; i <= countPage; i++) {
                Pagination.appendChild(makePagBut(i, actPage));
            }
        } else {
            for (let i = actPage-1; i <= actPage+1; i++) {
                Pagination.appendChild(makePagBut(i, actPage));
            }
            Pagination.appendChild(makePag3Dot());
            Pagination.appendChild(makePagBut(countPage));  
        }
       } else {
            for (let i = 1; i <= 5; i++) {
                Pagination.appendChild(makePagBut(i, actPage));
            }
            Pagination.appendChild(makePag3Dot());
            Pagination.appendChild(makePagBut(countPage));
       } 
    } else {
        for (let i = 1; i <= 7; i++) {
            Pagination.appendChild(makePagBut(i, actPage));
        }
    }
};


const refreshTable = () => {
    //sortObj.set('', -1);
    loadTable(false);
};

const changePage = event => {
    pageNum.set(+event.target.innerText);
    loadTable(false);
};

const decPage = () => {
    let page = pageNum.get();
    page--;
    if (page <= 0 ) {
        return;
    }

    pageNum.set(page);
    loadTable(false);
};

const incPage = () => {
    let page = pageNum.get();
    page++;
    if (page > pageCount.get()) {
        return;
    }

    pageNum.set(page);
    loadTable(false);
};

const inputChangePage = (event) => {
    if (event.keyCode != 13 && event.target.id != 'pagination_input_but') {
        return;
    }
    const pagInput = document.getElementById('pagination_input');
    const page = Number(pagInput.value);
    if (Number.isNaN(page)) {
        return;
    }
    if (page > pageCount.get() || page < 1) {
        return;
    }
    pageNum.set(page);
    loadTable(false);
    pagInput.value = '';
};

const makeArrowSort = (num, id) => {
    const d = document.createElement('span');
    d.id = "sort_arrow_id_"+id;
    d.innerHTML = `&uarr;`;
    if (num === 0) {
        d.innerHTML = `&darr;`;  
    }
    return d;
};

const getIDHeadGridElement = (id = "") => {
    if(id.includes("sort_arrow_id_")) {
        return id.split("sort_arrow_id_")[1];
    }
    if(id.includes("td_head_id_")) {
        return id.split("td_head_id_")[1];
    }
    if(id.includes("td_head_wrapper_id_")) {
        return id.split("td_head_wrapper_id_")[1];
    }
    if(id.includes("td_head_cap_id_")) {
        return id.split("td_head_cap_id_")[1];
    }
    if(id.includes("td_head_filter_id_")) {
        return id.split("td_head_filter_id_")[1];
    }
    if(id.includes("td_head_filter_img_id_")) {
        return id.split("td_head_filter_img_id_")[1];
    }
    if(id.includes("td_head_cap_span_id_")) {
        return id.split("td_head_cap_span_id_")[1];
    }
    return -1;
};

const sort = event => {
    const thead = document.getElementById('thead_id');
    for (let i = 0; i < thead.childNodes[0].childNodes.length; i++) {
        const element = thead.childNodes[0].childNodes[i];
        if (getIDHeadGridElement(event.target.id) === getIDHeadGridElement(element.id)) {
            const id = +getIDHeadGridElement(element.id);
            const name = document.getElementById('td_head_cap_span_id_'+id);
            const parent = document.getElementById('td_head_cap_id_'+id);
            if (element.hasAttribute('sort')) {
                const arrow = document.getElementById('sort_arrow_id_'+id);
                if (+element.getAttribute('sort') === 0) {
                    element.setAttribute('sort', 1); 
                    parent.removeChild(arrow);
                    parent.appendChild(makeArrowSort(1, id));
                } else {
                    element.setAttribute('sort', 0);
                    parent.removeChild(arrow);
                    parent.appendChild(makeArrowSort(0, id));
                }
            } else {
                element.setAttribute('sort', 0);
                parent.appendChild(makeArrowSort(0, id));
            }
            sortObj.set(tableHead.getNameByCap(name.textContent), +element.getAttribute('sort'));
        } else {
            if (element.getAttribute('sort') !== null) {
                const id = +getIDHeadGridElement(element.id);
                const arrow = document.getElementById('sort_arrow_id_'+id);
                const parent = arrow.parentNode; 
                parent.removeChild(arrow);
                element.removeAttribute('sort');
            }
        }
    }
    loadTable(false);
};
*/


/*************************************************************** 
****************************Filter******************************
***************************************************************/
/*
const closeModalForm = (event) => {
    event.stopPropagation();
    if (event.keyCode === 27 || 
        event.target.id === 'modal-wrapper' || 
        event.target.id === 'butCloseModal' ||
        event.target.id === 'filter_but_cancel' ||
        event.target.id === 'filter_but_ok') {
        if(document.getElementById('modal-wrapper')){
            document.body.removeChild(document.getElementById('modal-wrapper'));
        }
        document.removeEventListener('keyup', closeModalForm);
    }
};

const makeModalForm = () => {
    const mainForm = document.createElement('div');
    mainForm.id = 'modal-wrapper';
    mainForm.className = 'modal-panel';
    mainForm.addEventListener('click', closeModalForm);
    document.addEventListener('keyup', closeModalForm);
    return mainForm;
};

const makeButtonFilter = (parent, id, cap) => {
    const el = document.createElement('button');
    parent.appendChild(el);
    el.id = id;
    el.innerHTML = cap;
    return el;
};

const setFilterNameParamByValue = (id) => {
    const name = document.getElementById("filter_name_"+id);
    const action = document.getElementById("filter_action_"+id);
    const value = document.getElementById("filter_value_"+id);
    let saveValue = value.value;
    if (numberFilterParam.value.includes(action.value)) {
        const parent = value.parentNode;
        if (Number.isNaN(+saveValue)) {
            saveValue = 0; 
        } 
        parent.innerHTML = `<input type="number" id="filter_value_${id}" style="max-width: 100px;" value = "${+saveValue}"></input>`;
    } else if (boolFilterParam.value.includes(action.value)) {
        const parent = value.parentNode;
        parent.innerHTML = `<select id = "filter_value_${id}">
        <option hidden="" disabled="" selected="" value="">  </option>
        <option value="true">Так</option>
        <option value="false">Ні</option>
        </select>`; 
    } else {
        const parent = value.parentNode;
        parent.innerHTML = `<input type="text" id="filter_value_${id}" style="max-width: 100px;" value = "${saveValue}"></input>`;
    }
    document.getElementById("filter_value_"+id).addEventListener('change', (event) => {
        const sid = event.target.id.split("filter_value_")[1];
        document.getElementById("filter_checkbox_"+sid).checked = true;
    });
};

const changeFilterValueParam = (event) => {
    const id = event.target.id.split("filter_action_")[1];
    setFilterNameParamByValue(id);
};

const addNewFilter = (event) => {
    event?.stopPropagation();
    parent = document.getElementById('filter_list');
    const newLine = document.createElement('tr');
    parent.appendChild(newLine);

    const id = filterDocumentID.new();
    
    newLine.id = 'filter_line_'+id;

    const checkbox = document.createElement('td');
    newLine.appendChild(checkbox);
    const inp1 = document.createElement('input');
        inp1.type = 'checkbox';
        inp1.id = 'filter_checkbox_'+id;
        checkbox.appendChild(inp1);
        inp1.addEventListener('click', (event) => {
            event.stopPropagation();
            const sid = event.target.id.split("filter_checkbox_")[1];
            document.getElementById('filter_line_'+sid).setAttribute("fast", false);
        });

    const name = document.createElement('td');
    newLine.appendChild(name);
        const scrollName = document.createElement('select');
        scrollName.id = 'filter_name_'+id;
        scrollName.innerHTML = `<option hidden disabled selected value>  </option>`;
        for (let index = 0; index < tableHead.getNames().length; index++) {
            const name = tableHead.getNames()[index];
            const cap = tableHead.getCaptions()[index];
            const element = document.createElement('option');
            element.value = name;
            element.text = cap;
            scrollName.appendChild(element);
        }
        scrollName.style.width = '100px';
        name.appendChild(scrollName);


    const action = document.createElement('td');
    newLine.appendChild(action);
        const actionName = document.createElement('select');
        actionName.id = "filter_action_"+id;
        actionName.style.width = '100px';
        actionName.innerHTML = `<option hidden="" disabled="" selected="" value="">  </option>`;
        for (let index = 0; index < numberFilterParam.value.length; index++) {
            const value = numberFilterParam.value[index];
            const text = numberFilterParam.text[index];
            const opt = document.createElement('option');
            opt.value = value;
            opt.text = text;
            actionName.appendChild(opt);
        } 
        for (let index = 0; index < textFilterParam.value.length; index++) {
            const value = textFilterParam.value[index];
            const text = textFilterParam.text[index];
            const opt = document.createElement('option');
            opt.value = value;
            opt.text = text;
            actionName.appendChild(opt);
        } 
        for (let index = 0; index < boolFilterParam.value.length; index++) {
            const value = boolFilterParam.value[index];
            const text = boolFilterParam.text[index];
            const opt = document.createElement('option');
            opt.value = value;
            opt.text = text;
            actionName.appendChild(opt);
        }             
        actionName.addEventListener('change', changeFilterValueParam);
        action.appendChild(actionName);

    const value = document.createElement('td');
    newLine.appendChild(value);
        const valueName = document.createElement('input');
        valueName.id = "filter_value_"+id;
        valueName.type = 'text';
        valueName.style.maxWidth = '100px';
        value.appendChild(valueName);
    
    const del = document.createElement('td');
    newLine.appendChild(del);
        const delBut = document.createElement('input');
        delBut.id = "del_but_"+id;
        delBut.type = "button";
        delBut.value = "x";
        delBut.addEventListener('click', removeCurrentFilters);
        del.appendChild(delBut);

    return newLine;    
}

const removeCurrentFilters = (event) => {
    event.stopPropagation();
    const id = event.target.id.split("del_but_")[1];
    const parent = document.getElementById('filter_line_'+id);
    parent.parentNode.removeChild(parent);
};

const setFilterButton = (event) => {
    event.stopPropagation();
    const parent = document.getElementById('filter_list');
    const filters = filterTableList.get();
    filters.clear();
    for (const p of parent.childNodes) {
        const id = p.id.split("filter_line_")[1];
        const name = document.getElementById('filter_name_'+id);
        const action = document.getElementById('filter_action_'+id);
        const value = document.getElementById('filter_value_'+id);
        let checkbox;
        if (value.value !== '') {
            checkbox = true; 
        } else {
            checkbox = false;
        }
        //const checkbox = document.getElementById('filter_checkbox_'+id);
        const fast = document.getElementById('filter_line_'+id).getAttribute("fast");
        filters.add(name.value, action.value, value.value, checkbox, fast);
    }
    closeModalForm(event);
    loadTable(false);
};

const loadFilters = () => {
   filterDocumentID.default(); 
   const filters = filterTableList.get();    
   for (const f of filters.getAll()) {
        const newL = addNewFilter();
        const id = newL.id.split("filter_line_")[1];
        const name = document.getElementById('filter_name_'+id);
        name.value = f.name;
        const action = document.getElementById('filter_action_'+id);
        action.value = f.action;
        setFilterNameParamByValue(id);
        const value = document.getElementById('filter_value_'+id);
        value.value = f.value;
        const checkbox = document.getElementById('filter_checkbox_'+id);
        checkbox.checked = f.checked;
        newL.setAttribute("fast", f.fast);
    }
};

const showFilter = (event) => {
    const mainForm = makeModalForm();
    document.body.appendChild(mainForm);
    mainForm.classList.add('modal-panel-dialog');

    const panel = document.createElement('div');
    mainForm.appendChild(panel);
    panel.className = 'filer-form';

    const butClose = document.createElement('button');
    panel.appendChild(butClose);
    butClose.id = 'butCloseModal';
    butClose.className = 'but-close-wrapper-modal';
    butClose.innerHTML = 'x';
    butClose.addEventListener('click', closeModalForm);

    const cap = document.createElement('div');
    cap.innerHTML = `<span><strong>Фільтрування<strong></span>`;
    cap.style.marginBottom = '16px';
    panel.appendChild(cap);

    const filter = document.createElement('div');
    panel.appendChild(filter);
    filter.className = 'filter-tab-wrapper';
    
    const menuBut = document.createElement('div');
    filter.appendChild(menuBut);
    menuBut.className = 'filer-top-menu';
        const butAdd = makeButtonFilter(menuBut, "filter_but_new", "Додати");
        butAdd.style.marginRight = "10px";
        butAdd.addEventListener('click', addNewFilter);

    const mainblock = document.createElement('div');
    filter.appendChild(mainblock);
    mainblock.className = 'filter-list-wrapper';
    mainblock.innerHTML = `<table><thead><tr><td></td>
    <td>Назва</td><td>Дія</td><td>Значення</td><td></td>
    </tr></thead><tbody id = "filter_list"></tbody></table>`;

    const bottomBut = document.createElement('div');
    filter.appendChild(bottomBut);
    bottomBut.className = 'filer-bottom-menu';
        const butCancel = makeButtonFilter(bottomBut, "filter_but_cancel", "Закрити");
        butCancel.style.marginRight = "10px";
        butCancel.addEventListener('click', closeModalForm);
        const butOk = makeButtonFilter(bottomBut, "filter_but_ok", "Застосувати");
        butOk.addEventListener('click', setFilterButton);

    loadFilters();    
};

const makeFastFilter = (event) => {
    event.stopPropagation();
    const elem = document.querySelector('.td-active');
    if (elem === null) {
        return;
    }
    const name = elem.getAttribute("tablename");
    const value = elem.textContent;

    let ok = false;

    const filters = filterTableList.get();
    for (const f of filters.getAll()) {
        if (f.name === name) {
            if (f.fast) {
                f.checked = false;
                f.fast = false;
            } else {
                f.action = "contains";
                f.value = value;
                f.checked = true;
                f.fast = true;
            }
            ok = true;
            break;
        }
    }    

    if (!ok) {
        filters.add(name, "contains", value, true, true);
    }

    loadTable(false);
};

const clearFilter = (event) => {
    event.stopPropagation();
    const filters = filterTableList.get();
    filters.clearChecked();
    loadTable(false);
};
*/

/*************************************************************** 
****************************Filter******************************
***************************************************************/

/*************************************************************** 
****************************Editor******************************
***************************************************************/

/*
const newData = () => {
    sendFetch("get", "/element?table="+activeTable+"&id=0", null, (response) => {
        //console.log(response);
        buildDialogPanelEditor("Створення нового елементу", "object", response, (event) => {
            let list = document.querySelectorAll('.edit-input-element-'+zIndex);
            const obj = {};
            for (const el of list) {
                const key = el.getAttribute('name');
                const value = el.getAttribute('objid') ? el.getAttribute('objid') : el.value;
                obj[key] = value;
            }
            sendFetch("post", "/elementedit?table="+activeTable, JSON.stringify(obj), (response) => {
                if (response.result !== "ok") {
                    alert(response.result);
                }
                loadTable(false);
            },
            (error) => {alert(error + `\n       
            Зверніться в службу технічної підтримки`);});
        });
    },
    (error) => {alert(error + `\n       
    Зверніться в службу технічної підтримки`);});
};

const editData = () => {
    if (activeGridElement === "") {
        return;
    }

    const actRow = document.getElementById(activeGridElement).parentNode;

    for (const it of actRow.childNodes) {
        if (it.getAttribute("tablename") === "id") {
            sendFetch("get", "/element?table="+activeTable+"&id="+it.title, null, (response) => {
                //console.log(response);
                buildDialogPanelEditor("Редагування елементу", "object", response, (event) => {
                    let list = document.querySelectorAll('.edit-input-element-'+zIndex);
                    const obj = {};
                    for (const el of list) {
                        const key = el.getAttribute('name');
                        const value = el.getAttribute('objid') ? el.getAttribute('objid') : el.value;
                        obj[key] = value;
                    }
                    //console.log(JSON.stringify(obj));
                    sendFetch("post", "/elementedit?table="+activeTable, JSON.stringify(obj), (response) => {
                        if (response.result !== "ok") {
                            alert(response.result);
                        }
                        loadTable(false);
                    },
                    (error) => {alert(error + `\n       
                    Зверніться в службу технічної підтримки`);});
                });
            },
            (error) => {alert(error + `\n       
            Зверніться в службу технічної підтримки`);});           
        }
    }
};
*/


/***************Constructor********************/

/*
const buildDialogPanelEditor = (caption = "", type = "", obj = {}, callback = () => {}) => {
    zIndexInc();
    const mainForm = makeModalFormEditor();
    document.body.appendChild(mainForm);
    listPanel.push(mainForm);
    mainForm.classList.add('modal-panel-dialog');

    const panel = document.createElement('div');
    mainForm.appendChild(panel);
    panel.className = 'dialog-form';

    const butClose = document.createElement('button');
    //panel.appendChild(butClose);
    butClose.className = 'but-close-wrapper-modal';
    butClose.innerHTML = 'x';
    butClose.addEventListener('click', closeModalFormEditor);

    const cap = document.createElement('div');
    panel.appendChild(cap);
    cap.innerHTML = caption;
    cap.className = "dialog-caption";
    cap.onmousedown = (e) => {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        //e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };
        document.onmousemove = (event) => {
            //event = event || window.event;
            event.preventDefault();
            pos1 = pos3 - event.clientX;
            pos2 = pos4 - event.clientY;
            pos3 = event.clientX;
            pos4 = event.clientY;
            panel.style.top = (panel.offsetTop - pos2) + "px";
            panel.style.left = (panel.offsetLeft - pos1) + "px";
        };
    };

    const butSizer = document.createElement('button');
    cap.appendChild(butSizer);
    butSizer.className = 'but-sizer-wrapper-modal';
    butSizer.innerHTML = '[]';
    butSizer.addEventListener('click', (event) => {
        event.stopPropagation();
        if (panel.classList.contains('dialog-form')) {
            panel.classList.remove('dialog-form');
            panel.classList.add('dialog-form-maximazed');
        } else {
            panel.classList.remove('dialog-form-maximazed');
            panel.classList.add('dialog-form');
        }
    });

    cap.appendChild(butClose);

    const workPanel = document.createElement('div');
    panel.appendChild(workPanel);
    workPanel.className = "dialog-work-panel";

    const butPanel = document.createElement('div');
    panel.appendChild(butPanel);
    butPanel.className = "dialog-but-menu";
        const butOk = makeButtonEditor(butPanel, "", "Застосувати");
        butOk.addEventListener('click', callback);
        butOk.style.marginRight = "10px";
        const butCancel = makeButtonEditor(butPanel, "", "Закрити");
        butCancel.addEventListener('click', closeModalFormEditor);
    
    switch (type) {
        case "grid":
            buildGridPanelEditor(workPanel, obj);
            butOk.innerHTML = `Обрати`;
            break;
    
        default:
            butSizer.style.display = 'none';
            for (const objEl of obj) {
                //console.log(obj);
                switch (objEl.struct.type) {
                    case "number":
                        makeNumberElementPanel(workPanel, objEl);
                        break;
                    case "booling":
                        makeBoolingElementPanel(workPanel, objEl);
                        break;    
                    case "relation":
                       makeRelationElementPanel(workPanel, objEl);
                        break;
                    default:
                       makeStringElementPanel(workPanel, objEl);
                        break;
                }
            }
            break;
    }    
};

const closeModalFormEditor = (event) => {
    event.stopPropagation();
    if (event.keyCode === 27 || 
        event.target.classList.contains("modal-panel") || 
        event.target.classList.contains("but-close-wrapper-modal") ||
        event.target.classList.contains("dialog-but-menu-element")) {
            let el = listPanel.pop();
            document.body.removeChild(el);
            zIndexDec();
            if (listPanel.length === 0) {
                document.removeEventListener('keyup', closeModalFormEditor);
                loadTable(false);
            }
    }
};

const buildGridPanelEditor = (parent, obj) => {
    const main = document.createElement('div');
    parent.appendChild(main);
    main.className = 'dialog-panel-grid-wrapper';

    const menu = document.createElement('div');
    main.appendChild(menu);
    menu.style.height = '40px';
    menu.style.backgroundColor = 'green';

    const tableWrapper = document.createElement('div');
    main.appendChild(tableWrapper);
    tableWrapper.style.height = '100%';

    const grid = document.createElement('table');
    tableWrapper.appendChild(grid);
    //grid.style.maxHeight = "100%";

    const pagin = document.createElement('div');
    main.appendChild(pagin);
    pagin.style.height = '40px';
    pagin.style.backgroundColor = 'blue';

    const thead = document.createElement('thead');
    grid.appendChild(thead);
    //thead.id = 'thead_id';
    const tr = document.createElement('tr');
    tr.className = "table-list-tr";
    thead.appendChild(tr);    
    for (const it of obj.tableHeaders) {
        const td = document.createElement('td');
        td.classList.add("unselectable");
        tr.appendChild(td);
        td.innerHTML = it.caption;
    }
    
    const tbody = document.createElement('tbody');
    grid.appendChild(tbody);
    for (let index = 0; index < obj.items.length; index++) {
        const it = obj.items[index];
        const tr = document.createElement('tr');
        tr.id = "table_edit_tr@"+index;
        tbody.appendChild(tr);
        tr.className = "table-list-tr";
        tr.classList.add('table-list-tr-edit');
        tr.setAttribute('objid', it.id);
        tr.setAttribute('objcap', it.name === undefined ? "" : it.name);
        for (const key in it) {
            if (Object.hasOwnProperty.call(it, key)) {
                const element = it[key];
                const td = document.createElement('td');
                td.id = `table_edit_td_${key}@`+index;
                td.classList.add("unselectable");
                tr.appendChild(td);
                td.innerHTML = element;
            }
        }
        tr.onclick = (event) => {
            event.stopPropagation();
            event.preventDefault();
            let id = event.target.id.split("@")[1];
            const actTR = document.getElementById("table_edit_tr@"+id);
            for (const it of document.querySelectorAll('.table-list-tr-edit')) {
                if (it === actTR) {
                    for (const iter of it.childNodes) {
                        iter.classList.add('tr-active');
                        iter.classList.add('tr-active-edit');
                    }        
                } else {
                    for (const iter of it.childNodes) {
                        iter.classList.remove('tr-active');
                        iter.classList.remove('tr-active-edit');
                    }
                }
            }
        };    
    }
    
    return;
};

const makeModalFormEditor = () => {
    const mainForm = document.createElement('div');
    mainForm.className = 'modal-panel';
    mainForm.style.zIndex = zIndex;
    mainForm.addEventListener('click', closeModalFormEditor);
    if(listPanel.length === 0) {
        document.addEventListener('keyup', closeModalFormEditor);
    }
    return mainForm;
};

const makeButtonEditor = (parent, id, cap) => {
    const el = document.createElement('button');
    parent.appendChild(el);
    el.id = id;
    el.innerHTML = cap;
    el.className = "dialog-but-menu-element";
    return el;
};

const makeStringElementPanel = (parent = HTMLDivElement, obj = {}) => {
    const main = document.createElement('div');
    parent.appendChild(main);

    if (!obj.struct.show) {
        main.style.display = "none";
    }

    const cap = document.createElement('div');
    main.appendChild(cap);
    cap.innerHTML = `<span>${obj.struct.caption}</span>`;

    const edit = document.createElement('input');
    main.appendChild(edit);
    edit.setAttribute("name", obj.struct.name);
    edit.classList.add('edit-input-element-'+zIndex);
    edit.value = obj.value === undefined ? "" : obj.value;
};

const makeNumberElementPanel = (parent = HTMLDivElement, obj = {}) => {
    const main = document.createElement('div');
    parent.appendChild(main);

    if (!obj.struct.show) {
        main.style.display = "none";
    }

    const cap = document.createElement('div');
    main.appendChild(cap);
    cap.innerHTML = `<span>${obj.struct.caption}</span>`;

    const edit = document.createElement('input');
    main.appendChild(edit);
    edit.classList.add('edit-input-element-'+zIndex);
    edit.setAttribute("name", obj.struct.name);
    edit.type = "number";
    edit.value = obj.value === undefined ? "" : obj.value;
};

const makeBoolingElementPanel = (parent = HTMLDivElement, obj = {}) => {
    const main = document.createElement('div');
    parent.appendChild(main);

    if (!obj.struct.show) {
        main.style.display = "none";
    }

    const cap = document.createElement('div');
    main.appendChild(cap);
    cap.innerHTML = `<span>${obj.struct.caption}</span>`;

    const edit = document.createElement('select');
    edit.style.width = '50px';
    main.appendChild(edit);
    edit.classList.add('edit-input-element-'+zIndex);
    edit.setAttribute("name", obj.struct.name);
        const elTrue = document.createElement('option');
        elTrue.value = "true";
        elTrue.text = "Так";
        edit.appendChild(elTrue);
        const elFalse = document.createElement('option');
        elFalse.value = "false";
        elFalse.text = "Ні";
        edit.appendChild(elFalse);
    edit.value = obj.value === undefined ? "" : obj.value;
};

const makeRelationElementPanel = (parent = HTMLDivElement, objIn = {}) => {
    //console.log(obj);
    const main = document.createElement('div');
    parent.appendChild(main);

    if (!objIn.struct.show) {
        main.style.display = "none";
    }

    const cap = document.createElement('div');
    main.appendChild(cap);
    cap.innerHTML = `<span>${objIn.struct.caption}</span>`;

    const wrapper = document.createElement('div');
    main.appendChild(wrapper);
        const edit = document.createElement('input');
        wrapper.appendChild(edit);
        edit.setAttribute("name", objIn.struct.name);
        edit.classList.add('edit-input-element-'+zIndex);
        edit.readOnly = true
        edit.value = objIn.value === undefined ? "" : objIn.value;
        edit.setAttribute('objid', objIn.id);
        const butChk = document.createElement('button');
        butChk.innerHTML = `...`;
        wrapper.appendChild(butChk);
        butChk.onclick = (event) => {
            sendFetch("get", "/elementlist?table="+objIn.struct.name, null, (response) => {
                //console.log(response);
                const pan = new GridPanelSelectObj(objIn.struct.name, "Обрати елемент");
                /*
                buildDialogPanelEditor(objIn.struct.caption, "grid", response, ()=>{
                    const actEl = document.querySelector('.tr-active-edit');
                    if (actEl) {
                        const row = actEl.parentNode;
                        edit.value = row.getAttribute('objcap');
                        edit.setAttribute('objid', row.getAttribute('objid'));
                    }
                });
                ////////
            },
            (error) => {alert(error + `\n       
            Зверніться в службу технічної підтримки`);});
        };
        const butDel = document.createElement('button');
        butDel.innerHTML = `X`;
        wrapper.appendChild(butDel);
        butDel.onclick = (event) => {
            edit.value = '';
            edit.setAttribute('objid', '0');
        };
        const butSwitch = document.createElement('button');
        butSwitch.innerHTML = `->`;
        wrapper.appendChild(butSwitch);  
        butSwitch.onclick = (event) => {
            const objID = edit.getAttribute('objid');
            if (objID === "") {
                return;
            }
            sendFetch("get", "/element?table="+objIn.struct.name+"&id="+objID, null, (response) => {
                //console.log(response);
                buildDialogPanelEditor("Редагування елементу", "object", response, (event) => {
                    let list = document.querySelectorAll('.edit-input-element-'+zIndex);
                    const obj = {};
                    for (const el of list) {
                        const key = el.getAttribute('name');
                        let value = el.getAttribute('objid') ? el.getAttribute('objid') : el.value;
                        if (el.getAttribute('type') === "number") {
                            if (!Number.isNaN(Number(value))) {
                                value = Number(value);
                            }
                        }
                        obj[key] = value;
                    }
                    sendFetch("post", "/elementedit?table="+objIn.struct.name, JSON.stringify(obj), (response) => {
                        if (response.result !== "ok") {
                            alert(response.result);
                        }
                        edit.value = obj.name;
                        edit.setAttribute('objid', obj.id);                       
                    },
                    (error) => {alert(error + `\n       
                    Зверніться в службу технічної підтримки`);});
                });
            },
            (error) => {alert(error + `\n       
            Зверніться в службу технічної підтримки`);});
        };
};
*/


/*************************************************************** 
****************************Editor******************************
***************************************************************/

/*
const makeResize = (event) => {
    event.stopPropagation();
    loadTable();
};

const addNewElement = event => {
    event.preventDefault();
    event.stopPropagation();
    newData();
};

const editElement = event => {
    event.preventDefault();
    event.stopPropagation();
    editData();
};

loadStruct();

window.addEventListener(`resize`, makeResize);
document.getElementById('butRefresh').addEventListener('click', refreshTable);
document.getElementById('butAdd').addEventListener('click', addNewElement);
document.getElementById('butEdit').addEventListener('click', editElement);
document.getElementById('pagination_left').addEventListener('click', decPage);
document.getElementById('pagination_right').addEventListener('click', incPage);
document.getElementById('pagination_input').addEventListener('keyup', inputChangePage);
document.getElementById('pagination_input_but').addEventListener('click', inputChangePage);
document.getElementById('filter_but').addEventListener('click', showFilter);
document.getElementById('filter_fast_but').addEventListener('click', makeFastFilter);
document.getElementById('filter_clear_but').addEventListener('click', clearFilter);
*/