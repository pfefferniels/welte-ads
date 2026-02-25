<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?xml-stylesheet type="text/xsl"?>
<xsl:stylesheet
    version="3.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    exclude-result-prefixes="tei">

    <xsl:mode on-no-match="shallow-copy" />
    <xsl:output method="xml" indent="yes" encoding="UTF-8"/>
    <xsl:template match="tei:teiHeader" />
    <xsl:template match="tei:orgName" />
    <xsl:template match="tei:placeName" />
    <xsl:template match="tei:persName" />
    <xsl:template match="tei:name" />
    <xsl:template match="tei:num" />
    <xsl:template match="tei:measure" />
    <xsl:template match="tei:desc" />
    <xsl:template match="tei:note" />
    <xsl:template match="tei:address" />


    <xsl:param name="sep" as="xs:string">-</xsl:param>
    <xsl:param name="pattern" as="xs:string" select="'(' || $sep || ')' || '(\s*)$'"/>

<!-- Template to handle text nodes that end in a hyphen -->
<xsl:template match="text()[matches(., $pattern) and following-sibling::node()[1][self::tei:lb]]" priority="4">
    <!-- Copy the text but remove the trailing hyphen -->
    <xsl:value-of select="replace(., $pattern, '')"/>
</xsl:template>

<!-- Template to handle text nodes that immediately precede an <lb /> but don't end in a hyphen -->
<xsl:template match="text()[not(matches(., $pattern)) and following-sibling::node()[1][self::tei:lb]]" priority="3">
    <xsl:value-of select="."/>
    <xsl:text> </xsl:text>
</xsl:template>

<!-- Template to handle text nodes that follow an <lb /> but are NOT directly after a hyphenated word -->
<xsl:template match="text()[preceding-sibling::node()[1][self::tei:lb] and not(preceding-sibling::text()[1][matches(., $pattern)])]" priority="2">
    <xsl:text> </xsl:text>
    <xsl:value-of select="."/>
</xsl:template>

<!-- Template to handle the immediate text node after a hyphenated one -->
<xsl:template match="text()[preceding-sibling::text()[1][matches(., $pattern)][following-sibling::node()[1][self::tei:lb]]]" priority="1">
    <xsl:value-of select="normalize-space(.)"/>
</xsl:template>


    <xsl:template match="tei:lb" />

</xsl:stylesheet>
