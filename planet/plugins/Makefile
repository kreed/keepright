libdir=/usr/share/osmosis/lib/default

pl.zip: *.class plugin.xml
	zip -r pl.zip *.class plugin.xml

%.class: %.java
	javac -cp "$(libdir)/*" *.java
