/*


Перший запит:
	метод: "GET"
	шлях:  "/company"
Відповідь сервера:
	{
		"tables": [
			{"name": "counterparts", "caption": "Контрагенти"},
			{"name": "goods", "caption": "Товари"},
			{"name": "orders", "caption": "Замовлення"}
		]
	}	



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
		"sortType": "toincrease", /* todecrease */
		"table": "counterparts"
	}
Відповідь сервера:
	{
		"countPage": 30,
		"page": 1,
		"table": "counterparts",
		"tableHeadres": [
			{"caption": "ID", "name": "id"},
			{"caption": "Найменування", "name": "name"},
			{"caption": "Вартість", "name": "price"}
		],
		"items": [
			[{"headerName": "id", "value": "2"}, {"headerName": "name", "value": "Квіти"}],
			[{"headerName": "id", "value": "3"}, {"headerName": "name", "value": "Квіти України"}],
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


*/


/*
	Шлях - /get

	Тіло запиту
	{
		"Таблиця" : "Контрагенти",
		"КількістьЕлементів" : 14,
		"Сторінка" : 3,
		"Сортування" : ""
		"ТипСортування": "Збільшення/Зменшення"?
		"Фільтрування" : ""
	}

	Тіло відповіді 
	{
		"Таблиця" : "Контрагенти",
		"Заголовки": ["id", "Назва"],
		"Сторінка" : 3,
		"КількістьСторінок": 30,
		"Елементи": [
						{
							"id": 1,
							"Назва": "Квіти"
						}
					]
	}
*/