#! /bin/bash

SAXON=/opt/homebrew/Cellar/saxon/11.4/bin/saxon
ENCODINGS=../tei/*.xml

basedir=$(dirname $(readlink -f "$BASH_SOURCE"))
WEBLICHT_CHAIN=./weblicht-chain.xml

USAGE='
Your WebLicht API key must be present in the WEBLICHTKEY environment
variable. To set it from file contents run the following code in your
terminal.

export WEBLICHTKEY=$(cat keyfile)
'

die()
{
    echo "$1" >&$2
    exit $3
}


if [ -v $WEBLICHTKEY ]; then die "$USAGE" 2 1 ; fi

url="https://weblicht.sfs.uni-tuebingen.de/WaaS/api/1.0/chain/process"

# all the intermediate steps will go here
mkdir preprocess
mkdir lemmatized
mkdir result

for e in $ENCODINGS
do
    FILENAME=`basename $e`
    TARGET=./preprocess/$FILENAME
    echo "preprocessing $e."

    # run preprocessing
    $SAXON -xsl:./preprocess.xsl -s:$e -o:$TARGET

    # run WebLicht chain
    echo "running WebLicht"
    curl -X POST -F chains=@$WEBLICHT_CHAIN -F content=@$TARGET -F apikey=$WEBLICHTKEY -o ./lemmatized/$FILENAME $url

    ## run postprocessing
    $SAXON -xsl:./postprocess.xsl -s:./lemmatized/$FILENAME -o:./result/$FILENAME
    echo "saved result in ./result/$FILENAME"

done

# remove temporary files
rm -r preprocess
rm -r lemmatized