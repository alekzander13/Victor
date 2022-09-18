package main

import (
	"html/template"
	"log"
	"os"
	"strings"
)

var templates *template.Template

// LoadAllTemplates populate templates
func LoadAllTemplates() {
	var alltemplates []string
	templatesDir := "./templates/"
	files, err := os.ReadDir(templatesDir)
	if err != nil {
		log.Fatal(err)
	}
	for _, file := range files {
		filename := file.Name()
		if strings.HasSuffix(filename, ".html") {
			alltemplates = append(alltemplates, templatesDir+filename)
		}
	}

	templates = template.Must(template.ParseFiles(alltemplates...))
}

// GetTemplate получим заготовку по имени
func GetTemplate(name string) (res *template.Template) {
	res = templates.Lookup(name + ".html")
	return
}
