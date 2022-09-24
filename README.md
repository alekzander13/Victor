Назва таблиці лежить в html файлі:
<div id="directory_name" style="display: none;">Контрагенти</div>

Отримання інформації про об'єкт:
	метод: "GET"
	шлях: "/element?table=tablename&id=objID"

	//Якщо  objID == "0" - сервер відповідає з пустими полями

	Відповідь сервера:
	[
		{
			"struct": {name: 'id', caption: 'ID', type: 'string', show: false, many: false}
			"id": "" || "objID" //якщо тип relation
			"value": "obj caption"
		}
	]


Отримання списку елементів таблиці:
	метод: "GET"
	шлях: "/elementlist?table=tablename"

	Відповідь сервера:
	[
		{
			"table": "tablename"
			"tableHeaders": [
				{name: 'id', caption: 'ID', type: 'string', show: false, many: false},
				{name: 'name', caption: 'Найменування', type: 'string', show: true, many: false},
				{name: 'lat', caption: 'Широта', type: 'number', show: true, many: false},
				{name: 'lng', caption: 'Довгота', type: 'number', show: true, many: false}
			]
			"items": [
				{id: '1', name: 'dot 1', lat: 43.75, lng: 27.44}
			]
		}
	]


Зміна або створення об'єкту
	метод: "POST"
	шлях: "/elementedit?table=tablename"
	тіло: {"id":"4644","name":"Tets 2","pos":"4","adress":"Test Adress 2","vip":"true"}
	Відповідь сервера:
	{"result":"ok"} або звіт про помилку


Запит на отримання даних:
	метод: "POST"
	шлях: "/loadtable"
	тіло: {
		"countElement": 14,
		"filters": [
			{"action": "contains", "name": "name", "value": "Квіти"},
			{"action": "contains", "name": "id", "value": "12"},
			{"name": "id", "action": "chois", "value": "true"}
			],
		"page": 1,
		"sort": "id",
		"sortType": "toincrease",
		"table": "Контрагенти"
	}
Відповідь сервера:
	{
		"countPage": 30,
		"page": 1,
		"table": "Контрагенти",
		"tableHeadres": [
			{name: 'id', caption: 'ID', type: 'string', show: false, many: false}, 
			{name: 'name', caption: 'Найменування', type: 'string', show: true, many: false},
			{name: 'pos', caption: 'Позиція', type: 'relation', show: true, many: false},
			{name: 'adress', caption: 'Адреса', type: 'string', show: true, many: false}, 
			{name: 'vip', caption: 'VIP', type: 'booling', show: true, many: false}
		],
		"items": [
			{id: '1064', name: 'ТОВ Фудмережа', pos: 'dot 1', adress: 'Дачна, 96', vip: 'Так'},
			{id: '1066', name: 'ФОП Носуля Т.В.', pos: 'dot 2', adress: 'Дачний, 1 (пров.)', vip: 'Ні'},
			{id: '1067', name: 'ФОП Заєць', pos: 'dot 3', adress: 'Шкільна, 67', vip: 'Ні'},
			{id: '1075', name: 'ТОВ ГРАДОСФЕРА', pos: 'dot 4 test', adress: 'Шкільна, 9', vip: 'Так'},
			{id: '1119', name: 'ФОП Єгоров', pos: 'dot 1', adress: 'Макаренка, 3 Г', vip: 'Ні'},
			{id: '5902', name: 'New Client', pos: 'dot 3', adress: 'Test New Adress', vip: 'Ні'},
			{id: '4644', name: 'Tets 2', pos: 'dot 4 test', adress: 'Test Adress 2', vip: 'Так'},
			{id: '2356', name: 'New test CLient', pos: 'dot 2', adress: 'Adress new', vip: 'Ні'},
			{id: '2237', name: 'test 3', pos: 'dot 1', adress: '111', vip: 'Ні'}
		]
	}

Сортування:
	"toincrease" - збільшення
	"todecrease" - зменшення

Дії фільтрування:	
	Числа: "equal", "notequal", "greater", "greaterorequal", "less", "lessorequal"
		   "Дорівнює", "Не дорівнює", "Більше", "Більше або дорівнює", "Менше", "Менше  або дорівнює"
	Строки: "contains", "notcontains"
			"Містить", "Не містить"
	Булеві: "chois"
			"Вибір"
