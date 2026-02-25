<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?xml-stylesheet type="text/xsl"?>
<xsl:stylesheet
    version="3.0"
    xmlns:metadata="http://www.dspin.de/data/metadata"
    xmlns:tc="http://www.dspin.de/data/textcorpus"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    exclude-result-prefixes="tc">

    <xsl:mode on-no-match="shallow-copy" />
    <xsl:output method="xml" indent="yes" encoding="UTF-8"/>
    <xsl:template match="tc:textSource" />
    <xsl:template match="tc:text" />
    <xsl:template match="tc:sentences" />
    <xsl:template match="tc:geo" />
    <xsl:template match="tc:POStags" />
    <xsl:template match="tc:namedEntities" />
    <xsl:template match="tc:tokens" />
    <xsl:template match="metadata:MetaData" />
</xsl:stylesheet>
