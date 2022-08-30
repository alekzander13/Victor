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


/*************************************************************** 
*****************************Struct*****************************
***************************************************************/
class tableFilter {
    constructor(name, caption) {
        this.name = name;
        this.caption = caption;
        this.list = [];
    }
    getName() {
        return this.name;
    }
    getCaption() {
        return this.caption;
    }
    clearValue() {
        for (let index = 0; index < this.list.length; index++) {
            this.list[index].value = '';
        }
    }
    clear() {
        this.list.splice(0, this.list.length);   
    }
    add(name, action, value) {
        this.list.push({name, action, value});
    }
    getAll() {
        return this.list;
    }
}

const filterTableList = {
    list: [],
    set(element) {
        const newEl = new tableFilter(element.name, element.caption);
        this.list.push(newEl);
    },
    get() {
        for (const el of this.list) {
            if (el.getName() === activeTable) {
                return el;
            }
        }
    }
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


const filterDocumentID = {
    id : 0,
    set() {
        return ++this.id;
    },
    get() {
        return this.id;
    }
};

let activeTable = "";


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


/*************************************************************** 
*****************************Struct*****************************
***************************************************************/


/*************************************************************** 
**********************Server Reqeusts***************************
***************************************************************/

//loadStruct - company struct loading at start
const loadStruct = () => {
    sendFetch("get", "/company", "", (response) => {
        //console.log(response);
        pageNum.set(1);
        sortObj.set('', -1);
        for (let index = 0; index < response.tables.length; index++) {
            const element = response.tables[index];
            filterTableList.set(element);
            if (index === 0) {
                activeTable = element.name; 
            }
        }
        loadTable();
    },
    (error) => {alert(error + `\n Зверніться в службу технічної підтримки`);}); 
};

const loadTable = (event) => {
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
        if (f.value !== '') {
            obj.filters.push(f);
        }
    }

    //console.log(obj);

    sendFetch("post", "/loadtable", JSON.stringify(obj), 
    (response) => {
        //console.log(response);
        if (response.table !== activeTable) {
            //alert('wrong table');
            //return;
        }
        const Table = document.getElementById('tableBodyID');
        if(response.items.length === obj.countElement) {
            Table.className = 'table-list';
        } else {
            Table.classList.remove('table-list');
        }
        const cols = makeTableColGroup(response.tableHeadres);
        const headers = makeTableHead(response.tableHeadres);
        const body = createTableBody(response.items);
        
        makePaginate(response.page, response.countPage);
        Table.innerHTML = ``;
        Table.appendChild(cols);
        Table.appendChild(headers);
        Table.appendChild(body);
    }, 
    (error) => {alert(error + `\n       
    Зверніться в службу технічної підтримки`);});
};

/*************************************************************** 
**********************Server Reqeusts***************************
***************************************************************/

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
    for (let index = 0; index < elements.length; index++) {
        const elem = elements[index];
        tableHead.add(elem.name, elem.caption);
        const td = document.createElement("td");
        td.className = "table-list-th-name";
        td.innerHTML = `<span>${elem.caption}</span>`;
        if (sortObj.getName() === elem.name) {
            td.setAttribute('sort', sortObj.getTypeNum());
            td.appendChild(makeArrowSort(sortObj.getTypeNum()));
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
    elements.forEach(element => {
        tbody.appendChild(createTableRow(element));
    });
    return tbody;
};

const createTableRow = (elements) => {
    const newRow = document.createElement('tr');
    newRow.className = 'table-list-tr';
    const tableHeaders = tableHead.getNames();
    for (let i = 0; i < tableHeaders.length; i++) {
        const tableHeader = tableHeaders[i];
        const td = document.createElement('td');
        if (tableHeader === "id") {
            td.className = 'table-list-td-id';
        } else {
            td.className = 'table-list-td-name';
        }
        td.classList.add('unselectable');
        td.classList.add('td-size');
        let value = "";
        let tableName = "";
        for (const element of elements) {
            if (element.headerName === tableHeader) {
                value = element.value;
                tableName = element.headerName;
                continue
            } 
        }
        td.title = value;
        td.innerText = value;
        td.setAttribute('tableName', tableName);
        td.onclick = (event) => {
            const actElem = event.target;
            const elements = document.querySelectorAll('.td-size');
            for (const element of elements) {
                if (element === actElem) {
                    actElem.classList.add('td-active'); 
                } else {
                    element.classList.remove('td-active');
                }
            }
        };
        newRow.appendChild(td);
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
    loadTable();
};

const changePage = event => {
    pageNum.set(+event.target.innerText);
    loadTable();
};

const decPage = () => {
    let page = pageNum.get();
    page--;
    if (page <= 0 ) {
        return;
    }

    pageNum.set(page);
    loadTable();
};

const incPage = () => {
    let page = pageNum.get();
    page++;
    if (page > pageCount.get()) {
        return;
    }

    pageNum.set(page);
    loadTable();
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
    loadTable();
    pagInput.value = '';
};

const makeArrowSort = (num) => {
    const d = document.createElement('span');
    d.innerHTML = `&uarr;`;
    if (num === 0) {
        d.innerHTML = `&darr;`;  
    }
    return d;
};

const sort = event => {
    const thead = document.getElementById('thead_id');
    for (let i = 0; i < thead.childNodes[0].childNodes.length; i++) {
        const element = thead.childNodes[0].childNodes[i];
        if (element === event.target || element === event.target.parentNode) {
            if (element.hasAttribute('sort')) {
                if (+element.getAttribute('sort') === 0) {
                    element.setAttribute('sort', 1); 
                    element.removeChild(element.childNodes[1]);
                    element.appendChild(makeArrowSort(1));
                } else {
                    element.setAttribute('sort', 0);
                    element.removeChild(element.childNodes[1]);
                    element.appendChild(makeArrowSort(0));
                }
            } else {
                element.setAttribute('sort', 0);
                element.appendChild(makeArrowSort(0));
            }
            sortObj.set(tableHead.getNameByCap(element.childNodes[0].innerText), +element.getAttribute('sort'));
        } else {
            element.removeAttribute('sort');
            if (element.childNodes.length > 1) {
                element.removeChild(element.childNodes[1]); 
            }
        }
    }
    loadTable();
};



/*************************************************************** 
****************************Filter******************************
***************************************************************/
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
    if (numberFilterParam.value.includes(action.value)) {
        const parent = value.parentNode;
        parent.innerHTML = `<input type="number" id="filter_value_${id}" style="max-width: 100px;"></input>`;
    } else if (boolFilterParam.value.includes(action.value)) {
        const parent = value.parentNode;
        parent.innerHTML = `<select id = "filter_value_${id}">
        <option hidden="" disabled="" selected="" value="">  </option>
        <option value="true">Так</option>
        <option value="false">Ні</option>
        </select>`; 
    } else {
        const parent = value.parentNode;
        parent.innerHTML = `<input type="text" id="filter_value_${id}" style="max-width: 100px;"></input>`;
    }
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

    const id = filterDocumentID.set();
    
    newLine.id = 'filter_line_'+id;

    const name = document.createElement('td');
    newLine.appendChild(name);
        const inp1 = document.createElement('input');
        inp1.type = 'checkbox';
        inp1.id = 'checkbox_'+id;
        name.appendChild(inp1);
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

    return newLine;    
}

const removeSelectedFilters = (event) => {
    let listRemoves = [];
    const parent = document.getElementById('filter_list');
    for (const p of parent.childNodes) {
        const id = p.id.split("filter_line_")[1];
        const chkb = document.getElementById("checkbox_"+id);
        if (chkb.checked) {
            listRemoves.push(p);
        }
    }

    for (const e of listRemoves) {
        parent.removeChild(e);
    }
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
        filters.add(name.value, action.value, value.value);
    }
    closeModalForm(event);
    loadTable();
};

const loadFilters = () => {
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
        const butDel = makeButtonFilter(menuBut, "filter_but_del", "Видалити");
        butDel.addEventListener('click', removeSelectedFilters);

    const mainblock = document.createElement('div');
    filter.appendChild(mainblock);
    mainblock.className = 'filter-list-wrapper';
    mainblock.innerHTML = `<table><thead><tr>
    <td>Назва</td><td>Дія</td><td>Значення</td>
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
    filters.clearValue();
    for (const f of filters.getAll()) {
        if (f.name === name) {
            f.action = "contains";
            f.value = value;
            ok = true;
            break;
        }
    }    

    if (!ok) {
        filters.add(name, "contains", value);
    }

    loadTable();
};

const clearFilter = (event) => {
    event.stopPropagation();
    const filters = filterTableList.get();
    filters.clear();
    loadTable();
};

/*************************************************************** 
****************************Filter******************************
***************************************************************/



loadStruct();

window.addEventListener(`resize`, loadTable);
document.getElementById('butRefresh').addEventListener('click', refreshTable);
document.getElementById('pagination_left').addEventListener('click', decPage);
document.getElementById('pagination_right').addEventListener('click', incPage);
document.getElementById('pagination_input').addEventListener('keyup', inputChangePage);
document.getElementById('pagination_input_but').addEventListener('click', inputChangePage);
document.getElementById('filter_but').addEventListener('click', showFilter);
document.getElementById('filter_fast_but').addEventListener('click', makeFastFilter);
document.getElementById('filter_clear_but').addEventListener('click', clearFilter);
