package main

type requestData struct {
	Table       string `json:"table"`
	CountOnPage int    `json:"countElement"`
	Page        int    `json:"page"`
	SortName    string `json:"sort"`
	SortType    string `json:"sortType"`
	//FilterName  string `json:"filters"`
}

type tableHeader struct {
	Name    string `json:"name"`
	Caption string `json:"caption"`
	Type    string `json:"type"`
}

type typesElement struct {
	Name    string `json:"name"`
	Caption string `json:"caption"`
	Type    string `json:"type"`
	Value   string `json:"value"`
	ID      string `json:"id"`
	Show    bool   `json:"show"`
	Many    bool   `json:"many"`
}

type mainResponseContragents struct {
	Table      string                `json:"table"`
	Fields     []tableHeader         `json:"tableHeaders"`
	Page       int                   `json:"page"`
	CountPages int                   `json:"countPage"`
	Elements   []dataItemContragents `json:"items"`
}

type dataItemContragents struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Pos    string `json:"pos"`
	Adress string `json:"adress"`
}

type posResponse struct {
	Table    string        `json:"table"`
	Fields   []tableHeader `json:"tableHeaders"`
	Elements []dataItemPos `json:"items"`
}

type dataItemPos struct {
	ID   string  `json:"id"`
	Name string  `json:"name"`
	Lat  float64 `json:"lat"`
	Lng  float64 `json:"lng"`
}
