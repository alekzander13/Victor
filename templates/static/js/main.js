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


/*************************************************************** 
*****************************Struct*****************************
***************************************************************/
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

const filterTableList = {
    list: tableFilter,
    set(name) {
       this.list = new tableFilter(name);
    },
    get() {
       return this.list;
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


/*************************************************************** 
*****************************Struct*****************************
***************************************************************/


/*************************************************************** 
**********************Server Reqeusts***************************
***************************************************************/

//loadStruct - company struct loading at start
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

    console.log(obj);

    sendFetch("post", "/loadtable", JSON.stringify(obj), 
    (response) => {
        //console.log(response);
        const Table = document.getElementById('tableBodyID');
        if(response.items.length === obj.countElement) {
            Table.className = 'table-list';
        } else {
            Table.classList.remove('table-list');
        }
        const cols = makeTableColGroup(response.tableHeadres);
        const headers = makeTableHead(response.tableHeadres);
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
        filters.add(name.value, action.value, value.value, checkbox/*.checked*/, fast);
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

/*************************************************************** 
****************************Filter******************************
***************************************************************/


const makeResize = (event) => {
    event.stopPropagation();
    loadTable();
};

loadStruct();

window.addEventListener(`resize`, makeResize);
document.getElementById('butRefresh').addEventListener('click', refreshTable);
document.getElementById('pagination_left').addEventListener('click', decPage);
document.getElementById('pagination_right').addEventListener('click', incPage);
document.getElementById('pagination_input').addEventListener('keyup', inputChangePage);
document.getElementById('pagination_input_but').addEventListener('click', inputChangePage);
document.getElementById('filter_but').addEventListener('click', showFilter);
document.getElementById('filter_fast_but').addEventListener('click', makeFastFilter);
document.getElementById('filter_clear_but').addEventListener('click', clearFilter);
