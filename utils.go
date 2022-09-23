package main

import "github.com/fatih/structs"

func checkJSONTagName(i interface{}, fieldName string) interface{} {
	fields := structs.Fields(i)
	for _, field := range fields {
		tag := field.Tag("json")
		if tag == fieldName {
			return field.Value()
		}
	}
	return nil
}
