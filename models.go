package main

type head struct {
	Table      string       `json:"table"`
	Fields     []headerItem `json:"tableHeadres"`
	Page       int          `json:"page"`
	CountPages int          `json:"countPage"`
	Elements   []dataItem   `json:"items"`
}

type headerItem struct {
	Name    string `json:"name"`
	Caption string `json:"caption"`
}

type dataItem struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Pos    string `json:"pos"`
	Adress string `json:"adress"`
}

type requestData struct {
	Table       string `json:"table"`
	CountOnPage int    `json:"countElement"`
	Page        int    `json:"page"`
	SortName    string `json:"sort"`
	SortType    string `json:"sortType"`
	//FilterName  string `json:"filters"`
}
