package main

import (
	"encoding/json"
	"io"
	"net/http"
	"sort"
	"strconv"
)

func MainHandle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Connection", "close")
	defer r.Body.Close()
	w.Header().Set("Cache-Control", "no-store")
	template := GetTemplate("index")
	template.Execute(w, nil)
}

func LoadTableHandle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Connection", "close")
	defer r.Body.Close()
	w.Header().Set("Cache-Control", "no-store")

	b, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var z requestData
	err = json.Unmarshal(b, &z)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var res head
	var tests []dataItem

	tests, err = myBase.getTableData()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	if z.SortName != "" {
		var tempT []dataItem
		var IDs []int
		mmap := make(map[int]dataItem)
		for _, v := range tests {
			id, err := strconv.Atoi(v.ID)
			if err != nil {
				continue
			}
			mmap[id] = v
			IDs = append(IDs, id)
		}
		sort.Slice(IDs, func(i, j int) bool {
			if z.SortType == "toincrease" {
				return i < j
			}
			return i >= j
		})

		for _, id := range IDs {
			tempT = append(tempT, mmap[id])
		}
		tests = tempT
	}

	/*
		for i := 1; i <= z.CountOnPage; i++ {
			it := dataItem{
				ID:   fmt.Sprintf("%d", i*z.Page),
				Name: "Квіти України new",
			}
			tests = append(tests, it)
		}


		if z.SortName != "" {
			if z.SortType == "todecrease" {
				var ttt []dataItem
				for i := len(tests) - 1; i >= 0; i-- {
					ttt = append(ttt, tests[i])
				}
				copy(tests, ttt)
			}
		}
	*/

	/*
		res.Fields = []header{
			{
				Name:    "id",
				Caption: "ID",
			},
			{
				Name:    "name",
				Caption: "Найменування",
			},
			{
				Name:    "pos",
				Caption: "Позиція",
			},
			{
				Name:    "adress",
				Caption: "Адреса",
			},
		}
	*/

	res.Table = "Контрагенти"

	res.Fields, err = myBase.getTableStruct()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	res.Page = z.Page

	res.CountPages = 30

	res.Elements = tests

	body, err := json.Marshal(res)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write(body)
}

/*
type tableElement struct {
	Name    string `json:"name"`
	Caption string `json:"caption"`
}

type company struct {
	TableList []tableElement `json:"tables"`
}

func CompanyHandle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Connection", "close")
	defer r.Body.Close()
	w.Header().Set("Cache-Control", "no-store")

	var comp company
	comp.TableList = []tableElement{
		{
			Name:    "counterparts",
			Caption: "Контрагенти",
		},
		{
			Name:    "goods",
			Caption: "Товари",
		},
		{
			Name:    "orders",
			Caption: "Замовлення",
		},
	}

	body, err := json.Marshal(comp)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write(body)
}
*/
