package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func ElementHandle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Connection", "close")
	defer r.Body.Close()
	w.Header().Set("Cache-Control", "no-store")

	if r.Method != "GET" {
		http.Error(w, "bad request method", http.StatusMethodNotAllowed)
		return
	}

	var table, id string = r.FormValue("table"), r.FormValue("id")

	var res []typesElement
	var err error

	switch table {
	case "contragents":
		res, err = tableContragents(id)

	case "pos":
		res, err = tablePos(id)

	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	b, err := json.Marshal(res)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write(b)
}

func tableContragents(id string) ([]typesElement, error) {
	var res []typesElement

	tableStruct, err := myBase.getTableContragentsStruct()
	if err != nil {
		return nil, err
	}

	for _, v := range tableStruct {
		newEl := typesElement{
			Name:    v.Name,
			Caption: v.Caption,
			Type:    v.Type,
			Show:    true,
			Many:    false,
		}
		if v.Name == "id" {
			newEl.Show = false
			newEl.Value = "0"
		}

		res = append(res, newEl)
	}

	if id != "0" {
		dataList, err := myBase.getTableContragentsData()
		if err != nil {
			return nil, err
		}
		for _, v := range dataList {
			if id == v.ID {
				for i, r := range res {
					if res[i].Type == "relation" {
						val := fmt.Sprintf("%v", checkJSONTagName(v, r.Name))
						spos, err := myBase.getTablePosData()
						if err != nil {
							return nil, err
						}
						for _, v := range spos {
							if v.ID == val {
								res[i].ID = v.ID
								res[i].Value = v.Name
								break
							}
						}
						continue
					}
					res[i].Value = fmt.Sprintf("%v", checkJSONTagName(v, r.Name))
				}
			}
		}
	}

	return res, nil
}

func tablePos(id string) ([]typesElement, error) {
	var res []typesElement
	tableStruct, err := myBase.getTablePosStruct()
	if err != nil {
		return nil, err
	}
	for _, v := range tableStruct {
		newEl := typesElement{
			Name:    v.Name,
			Caption: v.Caption,
			Type:    v.Type,
			Show:    true,
			Many:    false,
		}
		if v.Name == "id" {
			newEl.Show = false
			newEl.Value = "0"
		}
		res = append(res, newEl)
	}

	if id != "0" {
		dataList, err := myBase.getTablePosData()
		if err != nil {
			return nil, err
		}
		for _, v := range dataList {
			if id == v.ID {
				for i, r := range res {
					res[i].Value = fmt.Sprintf("%v", checkJSONTagName(v, r.Name))
				}
			}
		}
	}

	return res, nil
}
