<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?xml-stylesheet type="text/xsl"?>
<xsl:stylesheet
    version="3.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
    xmlns:pc="http://schema.primaresearch.org/PAGE/gts/pagecontent/2019-07-15"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    exclude-result-prefixes="tei">

    <xsl:mode on-no-match="shallow-copy" />
    
    <xsl:output method="xml" indent="yes" encoding="UTF-8"/>
    
    <xsl:template match="pc:PcGts">
        <xsl:element name="TEI" namespace="http://www.tei-c.org/ns/1.0">
            <xsl:element name="teiHeader" namespace="http://www.tei-c.org/ns/1.0">
                <xsl:apply-templates mode="header" />
            </xsl:element>
            <xsl:element name="facsimile" namespace="http://www.tei-c.org/ns/1.0">
                <xsl:apply-templates mode="facsimile"/>
            </xsl:element>
            <xsl:element name="text" namespace="http://www.tei-c.org/ns/1.0">
                <xsl:apply-templates mode="text" />
            </xsl:element>
        </xsl:element>
    </xsl:template>
    
    <xsl:template match="pc:TextRegion" mode="facsimile">
        <xsl:element name="zone" namespace="http://www.tei-c.org/ns/1.0">
            <xsl:attribute name="points" select="pc:Coords/@points" />
            <xsl:attribute name="id" select="@id" />
        </xsl:element>
    </xsl:template>
    
    <xsl:template match="pc:Metadata" mode="text facsimile"/>
    <xsl:template match="pc:Creator" mode="text facsimile"/>
    <xsl:template match="pc:Created" mode="text facsimile"/>
    
    <xsl:template match="pc:Metadata" mode="header">
        
    </xsl:template>
    
    <xsl:template match="pc:Creator" mode="header">
        <xsl:element name="revDesc" namespace="http://www.tei-c.org/ns/1.0">
            <xsl:element name="p" namespace="http://www.tei-c.org/ns/1.0">
                <xsl:apply-templates select="text()" />
            </xsl:element>
        </xsl:element>
    </xsl:template>
    
    <xsl:template match="pc:Created" mode="header">
        
    </xsl:template>
    
    <xsl:template match="pc:TextRegion" mode="header" />

    <xsl:template match="pc:Page" mode="facsimile">
        <xsl:element name="surface" namespace="http://www.tei-c.org/ns/1.0">
            <xsl:element name="graphic" namespace="http://www.tei-c.org/ns/1.0">
                <xsl:attribute name="url" select="@imageFilename" />
                <xsl:attribute name="width" select="@imageWidth" />
                <xsl:attribute name="height" select="@imageHeight" />
            </xsl:element>
            
            <xsl:apply-templates mode="facsimile" />
        </xsl:element>
    </xsl:template>
    
    <xsl:template match="pc:TextRegion" mode="text">
        <xsl:element name="div" namespace="http://www.tei-c.org/ns/1.0">
            <xsl:attribute name="facs" select="concat('#', @id)" />
            <xsl:if test="@custom='structure {type:Illustration;}'">
                <xsl:attribute name="type">illustration</xsl:attribute>
            </xsl:if>
            <xsl:apply-templates select="pc:TextLine" mode="text"/>
        </xsl:element>
    </xsl:template>
    
    <xsl:template match="pc:TextLine" mode="text">
        <xsl:element name="lb" namespace="http://www.tei-c.org/ns/1.0" />
        <xsl:apply-templates select="pc:TextEquiv/pc:Unicode/text()"/>
    </xsl:template>
    
    <xsl:template match="pcTextRegion/pc:Coords" mode="text" />
        
    
</xsl:stylesheet>
