package main

import (
	"encoding/json"
	"os"
	"sync"
)

type database struct {
	mu        sync.RWMutex
	compName  string
	tableName string
}

var myBase database

func (db *database) setCompany(name string) {
	defer db.mu.Unlock()
	db.mu.Lock()
	db.compName = name
}

func (db *database) setTable(name string) {
	defer db.mu.Unlock()
	db.mu.Lock()
	db.tableName = name
}

func (db *database) getTableStruct() ([]headerItem, error) {
	defer db.mu.RUnlock()
	db.mu.RLock()
	var res []headerItem
	b, err := os.ReadFile("base/" + db.compName + "/" + db.tableName + "/struct.json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(b, &res)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (db *database) getTableData() ([]dataItem, error) {
	defer db.mu.RUnlock()
	db.mu.RLock()
	var res []dataItem
	b, err := os.ReadFile("base/" + db.compName + "/" + db.tableName + "/data.json")
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(b, &res)
	if err != nil {
		return nil, err
	}

	return res, nil
}
