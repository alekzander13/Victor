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

	var reqData requestData
	err = json.Unmarshal(b, &reqData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var body []byte

	switch reqData.Table {
	case "contragents":
		body, err = makeContragents(reqData)
	case "pos":
		body, err = makePos(reqData)
	default:
		http.Error(w, "bad table name: "+reqData.Table, http.StatusInternalServerError)
		return
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write(body)
}

func makeContragents(z requestData) ([]byte, error) {
	var res mainResponseContragents

	tests, err := myBase.getTableContragentsData()
	if err != nil {
		return nil, err
	}

	listContrAg := make([]dataItemContragents, len(tests))

	copy(listContrAg, tests)

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
		return nil, err
	}

	res.Page = z.Page

	res.CountPages = 30

	spos, err := myBase.getTablePosData()
	if err != nil {
		return nil, err
	}

	for i, bItem := range tests {
		for _, sp := range spos {
			if sp.ID == bItem.Pos {
				bItem.Pos = sp.Name
				tests[i] = bItem
				continue
			}
		}

		for _, ca := range listContrAg {
			if ca.ID == bItem.Maincontragent {
				bItem.Maincontragent = ca.Name
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

	return json.Marshal(res)
}

func makePos(z requestData) ([]byte, error) {
	var res mainResponsePos

	tests, err := myBase.getTablePosData()
	if err != nil {
		return nil, err
	}

	if z.SortName != "" {
		var tempT []dataItemPos
		var IDs []int
		mmap := make(map[int]dataItemPos)
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

	res.Table = "Позиція"

	res.Fields, err = myBase.getTablePosStruct()
	if err != nil {
		return nil, err
	}

	res.Page = z.Page

	res.CountPages = 30

	res.Elements = tests

	return json.Marshal(res)
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
