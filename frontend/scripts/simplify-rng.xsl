<?xml version="1.0" encoding="UTF-8"?>
<!--
  Simplifies the RELAX NG schema that the TEI Stylesheets generate from the
  project ODD, without changing what it accepts: a group, zeroOrMore,
  oneOrMore or optional loses its <empty/> patterns and becomes <empty/> if
  nothing else is left; a group of a single pattern becomes that pattern.

  The ODD leaves out most elements of TEI, so odd2relax writes such patterns
  where it drops parts of a content model (e.g. <front> and <back> from that
  of <facsimile>). libxml2, and so xmllint, which validates the files in CI,
  cannot compile a schema in which an element that may contain itself has a
  group of a single pattern as its content: simplifying the schema, it links
  two attribute definitions into a loop and never ends (seen with libxml2
  2.9.14 and 2.14.6). Used by build-schema.sh.
-->
<xsl:stylesheet version="3.0"
   xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
   xmlns:rng="http://relaxng.org/ns/structure/1.0"
   exclude-result-prefixes="rng">

   <xsl:output method="xml" encoding="UTF-8" indent="yes"/>
   <xsl:strip-space elements="rng:*"/>
   <xsl:preserve-space elements="rng:value rng:param"/>

   <xsl:mode on-no-match="shallow-copy"/>

   <xsl:template match="rng:group | rng:zeroOrMore | rng:oneOrMore | rng:optional">
      <xsl:variable name="content" as="node()*">
         <xsl:apply-templates/>
      </xsl:variable>
      <xsl:variable name="patterns" select="$content[self::rng:*][not(self::rng:empty)]"/>
      <xsl:choose>
         <xsl:when test="empty($patterns)">
            <xsl:element name="empty" namespace="http://relaxng.org/ns/structure/1.0"/>
         </xsl:when>
         <xsl:when test="self::rng:group and count($patterns) = 1">
            <xsl:sequence select="$patterns"/>
         </xsl:when>
         <xsl:otherwise>
            <xsl:copy>
               <xsl:copy-of select="@*"/>
               <xsl:sequence select="$content[not(self::rng:empty)]"/>
            </xsl:copy>
         </xsl:otherwise>
      </xsl:choose>
   </xsl:template>

</xsl:stylesheet>
