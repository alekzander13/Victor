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

	var res mainResponseContragents
	var tests []dataItemContragents

	tests, err = myBase.getTableContragentsData()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if z.SortName != "" {
		var tempT []dataItemContragents
		var IDs []int
		mmap := make(map[int]dataItemContragents)
		for _, v := range tests {
			id, err := strconv.Atoi(v.ID)
			if err != nil {
				continue
			}
			mmap[id] = v
			IDs = append(IDs, id)
		}
		sort.Ints(IDs)
		if z.SortType == "toincrease" {
			for _, id := range IDs {
				tempT = append(tempT, mmap[id])
			}
		} else {
			for i := len(IDs) - 1; i >= 0; i-- {
				tempT = append(tempT, mmap[IDs[i]])
			}
		}

		tests = tempT
	}

	res.Table = "Контрагенти"

	res.Fields, err = myBase.getTableContragentsStruct()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	res.Page = z.Page

	res.CountPages = 30

	spos, err := myBase.getTablePosData()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for i, bItem := range tests {
		for _, sp := range spos {
			if sp.ID == bItem.Pos {
				bItem.Pos = sp.Name
				tests[i] = bItem
				continue
			}
		}
		if bItem.Vip == "true" {
			bItem.Vip = "Так"
		} else {
			bItem.Vip = "Ні"
		}
		tests[i] = bItem
	}

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
