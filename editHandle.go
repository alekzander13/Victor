package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func ElementHandle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Connection", "close")
	defer r.Body.Close()
	w.Header().Set("Cache-Control", "no-store")

	if r.Method != "POST" {
		http.Error(w, "bad request method", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var el editElement
	err = json.Unmarshal(body, &el)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if el.Relation == "pos" {
		res, err := realtionPos(el.ID)
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
		return
	}

	var res []typesElement

	tableStruct, err := myBase.getTableStruct()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, v := range tableStruct {
		newEl := typesElement{
			Name:    v.Name,
			Caption: v.Caption,
			Type:    "string",
			Show:    true,
			Many:    false,
		}
		if v.Name == "id" {
			newEl.Show = false
			newEl.Value = "0"
		}
		if v.Name == "pos" {
			newEl.Type = "relation"
		}
		res = append(res, newEl)
	}

	if el.ID != "0" {
		dataList, err := myBase.getTableData()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		for _, v := range dataList {
			if el.ID == v.ID {
				for i, r := range res {
					if res[i].Type == "relation" {
						val := fmt.Sprintf("%v", checkJSONTagName(v, r.Name))
						spos, err := myBase.getListTablePos()
						if err != nil {
							http.Error(w, err.Error(), http.StatusInternalServerError)
							return
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

	b, err := json.Marshal(res)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write(b)
}

func realtionPos(id string) ([]typesElement, error) {
	var res []typesElement
	tableStruct, err := myBase.getTablePosStruct()
	if err != nil {
		return nil, err
	}
	for _, v := range tableStruct {
		newEl := typesElement{
			Name:    v.Name,
			Caption: v.Caption,
			Type:    "string",
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
		dataList, err := myBase.getListTablePos()
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
