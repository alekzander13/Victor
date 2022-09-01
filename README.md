Назва таблиці лежить в html файлі:
<div id="directory_name" style="display: none;">Контрагенти</div>


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
			{"caption": "ID", "name": "id"},
			{"caption": "Найменування", "name": "name"},
			{"caption": "Вартість", "name": "price"}
		],
		"items": [
			["id": "2", "name": "Квіти"],
			["id": "3", "name": "Квіти України"],
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
