package main

import (
	"encoding/json"
	"io"
	"net/http"
)

func ElementListHandle(w http.ResponseWriter, r *http.Request) {
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

	type rel struct {
		Table string `json:"table"`
		Name  string `json:"name"`
	}

	var obj rel

	err = json.Unmarshal(body, &obj)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	switch obj.Name {
	case "pos":
		rList, err := myBase.getListTablePos()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var result posResponse
		result.Table = obj.Table
		result.Elements = rList

		result.Fields, err = myBase.getTablePosStruct()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		b, err := json.Marshal(result)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Write(b)
		return
	default:
	}

	http.Error(w, "relation doesn't exist", http.StatusBadRequest)
}
