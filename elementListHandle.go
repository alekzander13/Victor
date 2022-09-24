package main

import (
	"encoding/json"
	"net/http"
)

func ElementListHandle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Connection", "close")
	defer r.Body.Close()
	w.Header().Set("Cache-Control", "no-store")

	if r.Method != "GET" {
		http.Error(w, "bad request method", http.StatusMethodNotAllowed)
		return
	}

	table := r.FormValue("table")

	switch table {
	case "pos":
		rList, err := myBase.getTablePosData()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var result posResponse
		result.Table = table
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
