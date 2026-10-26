import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { demoWallpapers, type Wallpaper, type WallpaperCollection } from "@shared/index";

const CATEGORIES = ["All","Nature","Landscapes","Ocean","Cars","Architecture","Space","AMOLED"];
type Tab = "Discover"|"Collection"|"Slideshow"|"Settings";
export default function HomeScreen() {
  const [tab,setTab]=useState<Tab>("Discover");
  const [items,setItems]=useState<Wallpaper[]>(demoWallpapers);
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("All");
  const [favorites,setFavorites]=useState<string[]>([]);
  const [collections,setCollections]=useState<WallpaperCollection[]>([{id:"favorites",name:"My Favorites",wallpaperIds:[],createdAt:new Date().toISOString()}]);
  const [selected,setSelected]=useState<Wallpaper|null>(null);
  const [interval,setIntervalValue]=useState("900");
  const [mode,setMode]=useState<"sequential"|"random">("sequential");
  const [collectionId,setCollectionId]=useState("favorites");
  const [nativeStatus,setNativeStatus]=useState("Native scheduler not started");
  useEffect(()=>{(async()=>{
    try {
      const [f,c,s]=await Promise.all([AsyncStorage.getItem("wallora:favorites"),AsyncStorage.getItem("wallora:collections"),AsyncStorage.getItem("wallora:slideshow")]);
      if(f)setFavorites(JSON.parse(f));
      if(c)setCollections(JSON.parse(c));
      if(s){const p=JSON.parse(s);setIntervalValue(p.interval??"900");setMode(p.mode??"sequential");setCollectionId(p.collectionId??"favorites");}
    } catch {}
  })();},[]);
  useEffect(()=>{void AsyncStorage.setItem("wallora:favorites",JSON.stringify(favorites));},[favorites]);
  useEffect(()=>{void AsyncStorage.setItem("wallora:collections",JSON.stringify(collections));},[collections]);
  useEffect(()=>{void AsyncStorage.setItem("wallora:slideshow",JSON.stringify({interval,mode,collectionId}));},[interval,mode,collectionId]);
  const visible=useMemo(()=>items.filter(w=>(category==="All"||w.category===category)&&(`${w.title} ${w.category} ${w.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))&&(tab!=="Collection"||favorites.includes(w.id)||collections.some(c=>c.id===collectionId&&c.wallpaperIds.includes(w.id)))),[items,category,query,tab,favorites,collections,collectionId]);
  async function importImage(){
    const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!permission.granted){Alert.alert("Permission required","Allow photo access to import an image.");return;}
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:1});
    if(result.canceled)return;
    const asset=result.assets[0];
    const w:Wallpaper={id:`local-${Date.now()}`,title:asset.fileName??"Imported image",imageUrl:asset.uri,thumbnailUrl:asset.uri,category:"My Images",tags:["imported"],width:asset.width,height:asset.height,license:"Personal image"};
    setItems(old=>[w,...old]);setCollections(old=>old.map(c=>c.id===collectionId?{...c,wallpaperIds:[...new Set([...c.wallpaperIds,w.id])]}:c));
  }
  function toggleFavorite(w:Wallpaper){setFavorites(old=>old.includes(w.id)?old.filter(id=>id!==w.id):[...old,w.id]);}
  async function applyWallpaper(target:"home"|"lock"|"both"){
    if(!selected)return;
    try {
      const Native = require("../modules/wallora-wallpaper");
      const result = await Native.WalloraWallpaper.setWallpaper(selected.imageUrl,target);
      Alert.alert(result?.success?"Wallpaper applied":"Wallpaper not applied",result?.message??"Native result received.");
    } catch {
      Alert.alert("Native module unavailable","Build and install the WALLORA development client on an Android device. Expo Go does not include wallpaper integration.");
    }
  }
  async function startSlideshow(){
    const selectedCollection=collections.find(c=>c.id===collectionId);
    const ids=selectedCollection?.id==="favorites"?favorites:(selectedCollection?.wallpaperIds??[]);
    if(ids.length<2){Alert.alert("Add more wallpapers","Choose a collection with at least two images.");return;}
    try{
      const Native=require("../modules/wallora-wallpaper");
      const result=await Native.WalloraWallpaper.startSlideshow(ids.map(id=>items.find(w=>w.id===id)?.imageUrl).filter(Boolean),Number(interval),mode);
      setNativeStatus(result?.message??"Scheduler response received");
    }catch{setNativeStatus("Native scheduler unavailable. Use an Android development build; WorkManager timing is inexact and minimum 15 minutes.");}
  }
  return <SafeAreaView style={s.safe}>
    <View style={s.header}><View><Text style={s.brand}>✦ WALLORA</Text><Text style={s.subbrand}>WALLPAPERS FOR YOUR WORLD</Text></View><Pressable style={s.importButton} onPress={importImage}><Text style={s.importText}>＋ Import</Text></Pressable></View>
    <View style={s.search}><Text style={{color:"#92939b"}}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search wallpapers..." placeholderTextColor="#777982" style={s.searchInput}/></View>
    {tab==="Slideshow"?<ScrollView contentContainerStyle={s.settingsWrap}><Text style={s.title}>Automatic slideshow</Text><Text style={s.muted}>Rotate images from your own collection using Android's native scheduler.</Text><Text style={s.label}>COLLECTION</Text>{collections.map(c=><Pressable key={c.id} style={[s.option,collectionId===c.id&&s.optionSelected]} onPress={()=>setCollectionId(c.id)}><Text style={s.optionText}>{c.name}</Text><Text style={s.mutedSmall}>{c.id==="favorites"?favorites.length:c.wallpaperIds.length} images</Text></Pressable>)}<Text style={s.label}>INTERVAL</Text><View style={s.wrapRow}>{[["60","1 min"],["300","5 min"],["900","15 min"],["1800","30 min"],["3600","1 hour"],["21600","6 hours"],["43200","12 hours"],["86400","24 hours"]].map(([v,label])=><Pressable key={v} style={[s.chip,interval===v&&s.chipActive]} onPress={()=>setIntervalValue(v)}><Text style={[s.chipText,interval===v&&s.chipTextActive]}>{label}</Text></Pressable>)}</View><Text style={s.label}>PLAYBACK</Text><View style={s.wrapRow}>{(["sequential","random"] as const).map(m=><Pressable key={m} style={[s.chip,mode===m&&s.chipActive]} onPress={()=>setMode(m)}><Text style={[s.chipText,mode===m&&s.chipTextActive]}>{m==="random"?"Random":"Sequential"}</Text></Pressable>)}</View><Pressable style={s.primary} onPress={startSlideshow}><Text style={s.primaryText}>Start slideshow</Text></Pressable><Text style={s.notice}>{nativeStatus}</Text><Text style={s.warning}>Android WorkManager cannot guarantee exact timing and has a 15-minute minimum interval. Shorter options are shown for configuration compatibility but are not guaranteed by this scheduler.</Text></ScrollView>:<><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categories}>{(tab==="Collection"?["All","My Favorites"]:CATEGORIES).map(c=><Pressable key={c} style={[s.chip,category===c&&s.chipActive]} onPress={()=>{setCategory(c==="My Favorites"?"All":c);if(c==="My Favorites")setCollectionId("favorites");}}><Text style={[s.chipText,category===c&&s.chipTextActive]}>{c}</Text></Pressable>)}</ScrollView>{tab==="Collection"&&<Text style={s.sectionTitle}>Your personal library</Text>}<FlatList data={visible} keyExtractor={w=>w.id} numColumns={2} contentContainerStyle={s.grid} columnWrapperStyle={{gap:12}} renderItem={({item})=><View style={s.card}><Pressable onPress={()=>setSelected(item)}><Image source={{uri:item.thumbnailUrl||item.imageUrl}} style={s.wallpaper}/></Pressable><View style={s.cardBottom}><View style={{flex:1}}><Text numberOfLines={1} style={s.cardTitle}>{item.title}</Text><Text style={s.cardCategory}>{item.category}</Text></View><Pressable onPress={()=>toggleFavorite(item)}><Text style={{fontSize:20,color:favorites.includes(item.id)?"#ff8c94":"#999"}}>{favorites.includes(item.id)?"♥":"♡"}</Text></Pressable></View></View>} ListEmptyComponent={<Text style={s.empty}>No wallpapers found. Try another search or import an image.</Text>}/></>}
    <View style={s.bottomNav}>{(["Discover","Collection","Slideshow","Settings"] as Tab[]).map(t=><Pressable key={t} onPress={()=>setTab(t)} style={s.navItem}><Text style={[s.navIcon,tab===t&&s.navIconActive]}>{t==="Discover"?"⌂":t==="Collection"?"♡":t==="Slideshow"?"↻":"⚙"}</Text><Text style={[s.navLabel,tab===t&&s.navLabelActive]}>{t}</Text></Pressable>)}</View>
    {selected&&<View style={s.modal}><Pressable style={s.modalClose} onPress={()=>setSelected(null)}><Text style={{color:"white",fontSize:20}}>×</Text></Pressable><Image source={{uri:selected.imageUrl}} style={s.detailImage} resizeMode="contain"/><Text style={s.detailTitle}>{selected.title}</Text><Text style={s.muted}>{selected.category} · {selected.width&&selected.height?`${selected.width} × ${selected.height}`:"Original resolution"}</Text><View style={s.wrapRow}><Pressable style={s.primary} onPress={()=>applyWallpaper("home")}><Text style={s.primaryText}>Set Home</Text></Pressable><Pressable style={s.primary} onPress={()=>applyWallpaper("lock")}><Text style={s.primaryText}>Set Lock</Text></Pressable><Pressable style={s.option} onPress={()=>applyWallpaper("both")}><Text style={s.optionText}>Both</Text></Pressable></View><Text style={s.warning}>Actual screen targets depend on Android version and device support.</Text></View>}
  </SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#090a0c"},header:{paddingHorizontal:18,paddingTop:12,paddingBottom:17,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},brand:{fontSize:19,fontWeight:"900",letterSpacing:2,color:"#f4f4f4"},subbrand:{fontSize:8,letterSpacing:1.4,color:"#92939b",marginTop:5},importButton:{paddingVertical:9,paddingHorizontal:12,borderWidth:1,borderColor:"#36373d",borderRadius:8},importText:{color:"#d5f49b",fontSize:11,fontWeight:"700"},search:{marginHorizontal:17,marginBottom:15,backgroundColor:"#15161a",borderWidth:1,borderColor:"#2b2c32",borderRadius:9,paddingHorizontal:12,height:42,flexDirection:"row",alignItems:"center",gap:9},searchInput:{flex:1,color:"white",fontSize:12},categories:{paddingHorizontal:16,gap:7,paddingBottom:17},chip:{paddingVertical:8,paddingHorizontal:12,borderRadius:7,borderWidth:1,borderColor:"#303137",backgroundColor:"#111215"},chipActive:{backgroundColor:"#c4f56b",borderColor:"#c4f56b"},chipText:{fontSize:10,color:"#b5b6be"},chipTextActive:{color:"#16190f",fontWeight:"700"},grid:{paddingHorizontal:16,paddingBottom:90,gap:17},card:{flex:1,minWidth:0},wallpaper:{height:235,width:"100%",borderRadius:9,backgroundColor:"#191a1e"},cardBottom:{flexDirection:"row",alignItems:"center",paddingTop:8,gap:8},cardTitle:{fontSize:11,color:"#f0f0f2",fontWeight:"600"},cardCategory:{fontSize:9,color:"#8c8d96",marginTop:4},bottomNav:{position:"absolute",bottom:0,left:0,right:0,height:65,borderTopWidth:1,borderTopColor:"#292a30",backgroundColor:"#101114",flexDirection:"row",justifyContent:"space-around",alignItems:"center",paddingBottom:4},navItem:{alignItems:"center",justifyContent:"center",gap:3,minWidth:55},navIcon:{fontSize:20,color:"#777982"},navIconActive:{color:"#c4f56b"},navLabel:{fontSize:9,color:"#777982"},navLabelActive:{color:"#c4f56b"},empty:{color:"#999",padding:30,textAlign:"center",fontSize:12},settingsWrap:{paddingHorizontal:18,paddingBottom:95},title:{fontSize:25,color:"#f4f4f4",fontWeight:"800",marginTop:7,marginBottom:8},muted:{color:"#999aa2",fontSize:11,lineHeight:18},mutedSmall:{color:"#92939b",fontSize:9},label:{color:"#a9d56a",fontSize:9,letterSpacing:1.5,marginTop:23,marginBottom:10,fontWeight:"700"},option:{borderWidth:1,borderColor:"#303137",backgroundColor:"#15161a",borderRadius:8,padding:12,marginBottom:7},optionSelected:{borderColor:"#a9d56a",backgroundColor:"#1b2116"},optionText:{color:"#efeff1",fontSize:11},wrapRow:{flexDirection:"row",flexWrap:"wrap",gap:7},primary:{paddingHorizontal:14,paddingVertical:11,backgroundColor:"#c4f56b",borderRadius:8,alignItems:"center",justifyContent:"center"},primaryText:{color:"#15180f",fontWeight:"800",fontSize:11},notice:{color:"#c4f56b",fontSize:10,marginTop:13,lineHeight:16},warning:{fontSize:10,lineHeight:16,color:"#a4a493",backgroundColor:"#1a1b16",borderWidth:1,borderColor:"#343d28",padding:12,borderRadius:8,marginTop:15},sectionTitle:{fontSize:15,color:"#eee",fontWeight:"700",paddingHorizontal:18,paddingBottom:12},modal:{position:"absolute",left:0,right:0,top:0,bottom:0,backgroundColor:"#090a0c",paddingTop:45,paddingHorizontal:20,alignItems:"flex-start"},modalClose:{position:"absolute",right:18,top:15,zIndex:2,padding:7},detailImage:{width:"100%",height:"55%",marginBottom:18},detailTitle:{fontSize:22,color:"white",fontWeight:"800",marginBottom:6}
});
