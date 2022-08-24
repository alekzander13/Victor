/*jshint esversion: 6*/
/*jshint asi: true*/

/* jshint ignore:start */
const sendFetch = async (path, body, callback, returnerror) => {
    try {
        const response = await fetch(path, {
            credentials: 'same-origin',
            method: 'POST',
            body: body
        }); 
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

const tableHead = {
    array : [],
    add(name) {
        this.array.push(name);
    },
    clear() {
        this.array.splice(0, this.array.length); 
    },
    get() {
        return this.array;
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
            return 'Збільшення';
        } 
        return 'Зменшення';
    },
    getName() {
        return this.name;
    },
    getTypeNum() {
        return this.type;
    }
}

pageNum.set(1);
sortObj.set('', -1);

const makeTableColGroup = (elements) => {
    const cgroup = document.createElement("colgroup");
    for (let index = 0; index < elements.length; index++) {
        const col = document.createElement("col");
        col.className = "table_list_col_name";
        if (index == 0) {
            col.className = "table_list_col_id";
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
        tableHead.add(elements[index]);
        const td = document.createElement("td");
        td.className = "table-list-th-name";
        td.innerHTML = `<span>${elements[index]}</span>`;
        if (sortObj.getName() === elements[index]) {
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

const createTableRow = (element) => {
    const newEl = document.createElement('tr');
    newEl.className = 'table-list-tr';
    const array = tableHead.get();
    for (let i = 0; i < array.length; i++) {
        const el = array[i];
        const td = document.createElement('td');
        if (el === 'id') {
            td.className = 'table_list_td_id';
        } else {
            td.className = 'table_list_td_name';
        }
        td.classList.add('unselectable');
        td.innerText = element[el];
        newEl.appendChild(td);
    }
    return newEl;
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
    delete tempEl;
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

const loadTable = (event) => {
    const obj = {};
    obj.Таблиця = 'Контрагенти';
    obj.КількістьЕлементів = getElementCountTable();
    obj.Сторінка = pageNum.get();
    if (sortObj.getName() != '') {
        obj.Сортування = sortObj.getName();
        obj.ТипСортування = sortObj.getType();
    } else {
        obj.Сортування = '';
        obj.ТипСортування = '';
    }
    obj.Фільтрування = '';
    //console.log(obj);
    sendFetch("/get", JSON.stringify(obj), 
    (response) => {
        const Table = document.getElementById('tableBodyID');
        Table.innerHTML = ``;
        if(response.Елементи.length === obj.КількістьЕлементів) {
            Table.className = 'table-list';
        } else {
            Table.classList.remove('table-list');
        }
        Table.appendChild(makeTableColGroup(response.Заголовки));
        Table.appendChild(makeTableHead(response.Заголовки));
        Table.appendChild(createTableBody(response.Елементи));
        makePaginate(response.Сторінка, response.КількістьСторінок);
    }, 
    (error) => {alert(error + `\n       
    Зверніться в службу технічної підтримки`);});
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
            sortObj.set(element.childNodes[0].innerText, +element.getAttribute('sort'));
        } else {
            element.removeAttribute('sort');
            if (element.childNodes.length > 1) {
                element.removeChild(element.childNodes[1]); 
            }
        }
    }
    loadTable();
};

loadTable();

document.getElementById('butRefresh').addEventListener('click', refreshTable);
document.getElementById('pagination_left').addEventListener('click', decPage);
document.getElementById('pagination_right').addEventListener('click', incPage);
document.getElementById('pagination_input').addEventListener('keyup', inputChangePage);
document.getElementById('pagination_input_but').addEventListener('click', inputChangePage);
